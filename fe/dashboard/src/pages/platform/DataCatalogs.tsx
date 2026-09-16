import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { platformApi } from '@/lib/platformApi';
import manifest from '@/generated/admin-data-catalogs.json';

interface ParameterDefinition {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  type: string;
  description?: string;
}

interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enum?: Array<string | number>;
  default?: unknown;
}

interface OperationDefinition {
  method: string;
  path: string;
  summary: string;
  identity_parameter?: string | null;
  parameters: ParameterDefinition[];
  fields?: FieldDefinition[];
}

interface CatalogDefinition {
  service: string;
  label: string;
  description: string;
  list: OperationDefinition | null;
  create: OperationDefinition | null;
  update: OperationDefinition | null;
  status: OperationDefinition | null;
  delete: OperationDefinition | null;
}

const catalogs = manifest.services as CatalogDefinition[];

function initialParameters(catalog: CatalogDefinition): Record<string, string> {
  const values: Record<string, string> = {};
  for (const operation of [catalog.list, catalog.create, catalog.update, catalog.status, catalog.delete]) {
    for (const parameter of operation?.parameters || []) {
      if (parameter.name === 'id') continue;
      values[parameter.name] ??= parameter.name === 'iso_code' ? '188'
        : parameter.name === 'document_version_id' ? '1' : '';
    }
  }
  return values;
}

function operationUrl(
  operation: OperationDefinition,
  parameters: Record<string, string>,
  row?: Record<string, unknown> | null,
): string {
  const pathParameterNames = [...operation.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  const identityParameter = operation.identity_parameter || pathParameterNames[pathParameterNames.length - 1];
  let path = operation.path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = row?.[name]
      ?? (row && name === identityParameter ? row.id : undefined)
      ?? parameters[name];
    if (value === undefined || value === null || value === '') throw new Error(`Falta el parámetro ${name}`);
    return encodeURIComponent(String(value));
  });
  const query = new URLSearchParams();
  for (const parameter of operation.parameters.filter((item) => item.in === 'query')) {
    const value = parameters[parameter.name];
    if (parameter.required && !value) throw new Error(`Falta el filtro ${parameter.name}`);
    if (value) query.set(parameter.name, value);
  }
  const suffix = query.toString();
  if (suffix) path += `?${suffix}`;
  return path;
}

function rowsFromResponse(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  if (!value || typeof value !== 'object') return [];
  const body = value as Record<string, unknown>;
  for (const key of ['data', 'items', 'results', 'content']) {
    if (Array.isArray(body[key])) return rowsFromResponse(body[key]);
  }
  return [body];
}

function parseField(field: FieldDefinition, value: string): unknown {
  if (value === '') return undefined;
  if (field.type === 'integer') return Number.parseInt(value, 10);
  if (field.type === 'number') return Number(value);
  if (field.type === 'boolean') return value === 'true';
  if (field.type === 'array' || field.type === 'object') return JSON.parse(value);
  return value;
}

export default function DataCatalogsPage() {
  const [service, setService] = useState(catalogs[0]?.service || '');
  const catalog = catalogs.find((item) => item.service === service) || catalogs[0];
  const [parameters, setParameters] = useState<Record<string, string>>(() => initialParameters(catalog));
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const operation = selected && catalog.update ? catalog.update : catalog.create;
  const fields = operation?.fields || [];
  const parameterDefinitions = useMemo(() => {
    const result = new Map<string, ParameterDefinition>();
    for (const item of [catalog.list, catalog.create, catalog.update, catalog.status, catalog.delete]) {
      for (const parameter of item?.parameters || []) {
        if (parameter.name !== item?.identity_parameter) result.set(parameter.name, parameter);
      }
    }
    return [...result.values()];
  }, [catalog]);
  const columns = useMemo(() => {
    const names = new Set<string>();
    rows.slice(0, 10).forEach((row) => Object.keys(row).forEach((key) => names.add(key)));
    return [...names].slice(0, 8);
  }, [rows]);

  const rowKey = (row: Record<string, unknown>, index: number) => {
    const identity = catalog.update?.identity_parameter
      || catalog.status?.identity_parameter
      || catalog.delete?.identity_parameter;
    return String((identity ? row[identity] : undefined) ?? row.id ?? index);
  };

  const changeCatalog = (nextService: string) => {
    const next = catalogs.find((item) => item.service === nextService)!;
    setService(nextService);
    setParameters(initialParameters(next));
    setRows([]);
    setSelected(null);
    setValues({});
    setNotice('');
  };

  const load = async () => {
    if (!catalog.list) return;
    setBusy(true); setNotice('');
    try {
      const response = await platformApi.data('GET', operationUrl(catalog.list, parameters));
      setRows(rowsFromResponse(response));
    } catch (error: any) {
      setNotice(error.message || 'No se pudo leer el catálogo.');
    } finally { setBusy(false); }
  };

  const selectRow = (row: Record<string, unknown>) => {
    setSelected(row);
    const nextValues: Record<string, string> = {};
    for (const field of catalog.update?.fields || []) {
      const value = row[field.name];
      nextValues[field.name] = value === undefined || value === null ? ''
        : typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
    setValues(nextValues);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!operation) return;
    setBusy(true); setNotice('');
    try {
      const body = Object.fromEntries(fields.flatMap((field) => {
        const value = parseField(field, values[field.name] ?? '');
        return value === undefined ? [] : [[field.name, value]];
      }));
      await platformApi.data(operation.method, operationUrl(operation, parameters, selected), body);
      setNotice(selected ? 'Elemento actualizado.' : 'Elemento creado.');
      setSelected(null); setValues({});
      await load();
    } catch (error: any) {
      setNotice(error.message || 'No se pudo guardar el elemento.');
    } finally { setBusy(false); }
  };

  const changeStatus = async (status: number) => {
    if (!selected || !catalog.status) return;
    setBusy(true);
    try {
      await platformApi.data(catalog.status.method, operationUrl(catalog.status, parameters, selected), { status });
      setNotice('Estado actualizado.'); await load();
    } catch (error: any) { setNotice(error.message || 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!selected || !catalog.delete || !window.confirm('¿Eliminar este elemento del catálogo?')) return;
    setBusy(true);
    try {
      await platformApi.data(catalog.delete.method, operationUrl(catalog.delete, parameters, selected));
      setSelected(null); setValues({}); setNotice('Elemento eliminado.'); await load();
    } catch (error: any) { setNotice(error.message || 'No se pudo eliminar el elemento.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-5 pt-4">
    <div><h1 className="text-3xl font-semibold tracking-tight">Catálogos de datos</h1>
      <p className="mt-1 text-muted-foreground">Consulta y administra los elementos compartidos por los servicios de datos de Hacienda.</p></div>
    {notice && <div role="status" className="rounded-lg border bg-muted p-3 text-sm">{notice}</div>}
    <Card><CardHeader><CardTitle>Servicio</CardTitle></CardHeader><CardContent className="space-y-4">
      <select className="w-full rounded-md border bg-background p-2" value={catalog.service} onChange={(event) => changeCatalog(event.target.value)}>
        {catalogs.map((item) => <option key={item.service} value={item.service}>{item.label} ({item.service})</option>)}
      </select>
      {!!parameterDefinitions.length && <div className="grid gap-3 md:grid-cols-3">
        {parameterDefinitions.map((parameter) => <label key={`${parameter.in}-${parameter.name}`} className="text-sm font-medium">
          {parameter.name}{parameter.required ? ' *' : ''}
          <Input className="mt-1" value={parameters[parameter.name] || ''} onChange={(event) => setParameters((current) => ({ ...current, [parameter.name]: event.target.value }))} placeholder={parameter.description} />
        </label>)}
      </div>}
      <Button onClick={() => void load()} disabled={busy || !catalog.list}>Actualizar lista</Button>
    </CardContent></Card>

    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader><CardTitle>{rows.length} elementos</CardTitle></CardHeader><CardContent>
        {!rows.length ? <p className="text-sm text-muted-foreground">Carga el catálogo para ver sus elementos.</p>
          : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground">
            {columns.map((column) => <th key={column} className="py-2 pr-4">{column}</th>)}</tr></thead><tbody>
            {rows.map((row, index) => <tr key={rowKey(row, index)} className={`cursor-pointer border-b hover:bg-muted ${selected && rowKey(selected, -1) === rowKey(row, index) ? 'bg-muted' : ''}`} onClick={() => selectRow(row)}>
              {columns.map((column) => <td key={column} className="max-w-64 truncate py-2 pr-4">{typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column] ?? '')}</td>)}</tr>)}
          </tbody></table></div>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>{selected ? `Editar #${rowKey(selected, 0)}` : 'Nuevo elemento'}</CardTitle></CardHeader><CardContent className="space-y-4">
        {!operation ? <p className="text-sm text-muted-foreground">Este servicio no publica una operación compatible.</p> : <form onSubmit={save} className="space-y-3">
          {fields.map((field) => <label key={field.name} className="block text-sm font-medium">{field.name}{field.required ? ' *' : ''}
            {field.enum ? <select className="mt-1 w-full rounded-md border bg-background p-2" value={values[field.name] || ''} required={field.required} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}>
              <option value="">Seleccionar</option>{field.enum.map((item) => <option key={String(item)} value={String(item)}>{String(item)}</option>)}</select>
              : field.type === 'boolean' ? <select className="mt-1 w-full rounded-md border bg-background p-2" value={values[field.name] || ''} required={field.required} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}>
                <option value="">Seleccionar</option><option value="true">Sí</option><option value="false">No</option></select>
                : <Input className="mt-1" type={['integer', 'number'].includes(field.type) ? 'number' : 'text'} value={values[field.name] || ''} required={field.required} placeholder={field.description || field.type} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />}
          </label>)}
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{selected ? 'Guardar cambios' : 'Crear elemento'}</Button>
            {selected && <Button type="button" variant="outline" onClick={() => { setSelected(null); setValues({}); }}>Cancelar</Button>}</div>
        </form>}
        {selected && <div className="flex flex-wrap gap-2 border-t pt-4">
          {catalog.status && <><Button size="sm" variant="outline" disabled={busy} onClick={() => void changeStatus(1)}>Activar</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void changeStatus(2)}>Desactivar</Button></>}
          {catalog.delete && <Button size="sm" variant="destructive" disabled={busy} onClick={() => void remove()}>Eliminar</Button>}
        </div>}
      </CardContent></Card>
    </div>
  </div>;
}
