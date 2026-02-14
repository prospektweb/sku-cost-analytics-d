import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowsLeftRight, TrendUp, TrendDown } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { compareSnapshots, formatCurrency, formatPercent, formatDateTime, parseDateTime } from '@/lib/data-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface SnapshotComparisonProps {
  snapshots: Snapshot[];
}

export function SnapshotComparison({ snapshots }: SnapshotComparisonProps) {
  const [snapshotAId, setSnapshotAId] = useState<number | null>(null);
  const [snapshotBId, setSnapshotBId] = useState<number | null>(null);

  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort(
      (a, b) => parseDateTime(a.dateTime).getTime() - parseDateTime(b.dateTime).getTime()
    );
  }, [snapshots]);

  const comparison = useMemo(() => {
    const snapshotA = snapshots.find((s) => s.id === snapshotAId);
    const snapshotB = snapshots.find((s) => s.id === snapshotBId);

    if (!snapshotA || !snapshotB) return null;

    return compareSnapshots(snapshotA, snapshotB);
  }, [snapshots, snapshotAId, snapshotBId]);

  if (snapshots.length < 2) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowsLeftRight size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Временное сравнение</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Недостаточно данных для сравнения. Необходимо минимум 2 снимка.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowsLeftRight size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Временное сравнение</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="snapshot-a">Снимок A (базовый)</Label>
          <Select
            value={snapshotAId?.toString() || ''}
            onValueChange={(value) => setSnapshotAId(value ? parseInt(value) : null)}
          >
            <SelectTrigger id="snapshot-a">
              <SelectValue placeholder="Выберите снимок" />
            </SelectTrigger>
            <SelectContent>
              {sortedSnapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id.toString()}>
                  {formatDateTime(parseDateTime(snapshot.dateTime))} -{' '}
                  {formatCurrency(snapshot.json.purchasePrice, snapshot.json.currency)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="snapshot-b">Снимок B (сравниваемый)</Label>
          <Select
            value={snapshotBId?.toString() || ''}
            onValueChange={(value) => setSnapshotBId(value ? parseInt(value) : null)}
          >
            <SelectTrigger id="snapshot-b">
              <SelectValue placeholder="Выберите снимок" />
            </SelectTrigger>
            <SelectContent>
              {sortedSnapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id.toString()}>
                  {formatDateTime(parseDateTime(snapshot.dateTime))} -{' '}
                  {formatCurrency(snapshot.json.purchasePrice, snapshot.json.currency)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {comparison && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-4">Общее изменение</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Было</div>
                <div className="text-2xl font-mono font-bold">
                  {formatCurrency(comparison.totalDelta.oldValue, comparison.totalDelta.currency)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {comparison.totalDelta.delta > 0 ? (
                  <TrendUp size={32} className="text-destructive" />
                ) : comparison.totalDelta.delta < 0 ? (
                  <TrendDown size={32} className="text-green-600" />
                ) : null}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Стало</div>
                <div className="text-2xl font-mono font-bold">
                  {formatCurrency(comparison.totalDelta.newValue, comparison.totalDelta.currency)}
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-center gap-4">
              <Badge
                variant={comparison.totalDelta.delta > 0 ? 'destructive' : 'default'}
                className="text-lg px-4 py-2"
              >
                {comparison.totalDelta.delta > 0 ? '+' : ''}
                {formatCurrency(comparison.totalDelta.delta, comparison.totalDelta.currency)}
              </Badge>
              <Badge
                variant={comparison.totalDelta.delta > 0 ? 'destructive' : 'default'}
                className="text-lg px-4 py-2"
              >
                {comparison.totalDelta.deltaPercent > 0 ? '+' : ''}
                {formatPercent(comparison.totalDelta.deltaPercent)}
              </Badge>
            </div>
          </div>

          {comparison.stageDeltas.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Изменения по этапам</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Этап</TableHead>
                    <TableHead className="text-right">Было</TableHead>
                    <TableHead className="text-right">Стало</TableHead>
                    <TableHead className="text-right">Изменение</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.stageDeltas.map((delta, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{delta.label}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(delta.oldValue, delta.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(delta.newValue, delta.currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-semibold ${
                          delta.delta > 0 ? 'text-destructive' : delta.delta < 0 ? 'text-green-600' : ''
                        }`}
                      >
                        {delta.delta > 0 ? '+' : ''}
                        {formatCurrency(delta.delta, delta.currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          delta.deltaPercent > 0 ? 'text-destructive' : delta.deltaPercent < 0 ? 'text-green-600' : ''
                        }`}
                      >
                        {delta.deltaPercent > 0 ? '+' : ''}
                        {formatPercent(delta.deltaPercent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {comparison.detailDeltas.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Изменения по деталям</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Деталь</TableHead>
                    <TableHead className="text-right">Было</TableHead>
                    <TableHead className="text-right">Стало</TableHead>
                    <TableHead className="text-right">Изменение</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.detailDeltas.map((delta, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{delta.label}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(delta.oldValue, delta.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(delta.newValue, delta.currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-semibold ${
                          delta.delta > 0 ? 'text-destructive' : delta.delta < 0 ? 'text-green-600' : ''
                        }`}
                      >
                        {delta.delta > 0 ? '+' : ''}
                        {formatCurrency(delta.delta, delta.currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          delta.deltaPercent > 0 ? 'text-destructive' : delta.deltaPercent < 0 ? 'text-green-600' : ''
                        }`}
                      >
                        {delta.deltaPercent > 0 ? '+' : ''}
                        {formatPercent(delta.deltaPercent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {!comparison && snapshotAId && snapshotBId && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Выберите два разных снимка для сравнения
        </div>
      )}
    </Card>
  );
}
