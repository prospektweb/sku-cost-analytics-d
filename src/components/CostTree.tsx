import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TreeStructure, CaretDown, CaretRight } from '@phosphor-icons/react';
import type { Snapshot, TreeNode } from '@/lib/types';
import { buildCostTree, formatCurrency, formatPercent, formatNumber } from '@/lib/data-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CostTreeProps {
  snapshot: Snapshot | null;
}

export function CostTree({ snapshot }: CostTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TreeStructure size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Дерево формирования стоимости</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Выберите период с данными для отображения дерева
        </div>
      </Card>
    );
  }

  const treeData = buildCostTree(snapshot);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        allIds.add(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(treeData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TreeStructure size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Дерево формирования стоимости</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-primary hover:underline"
          >
            Развернуть все
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-primary hover:underline"
          >
            Свернуть все
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {treeData.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={toggleNode}
            currency={snapshot.json.currency}
          />
        ))}
      </div>
    </Card>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  currency: string;
}

function TreeNodeComponent({
  node,
  level,
  expandedNodes,
  onToggle,
  currency,
}: TreeNodeComponentProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer',
          level === 0 && 'bg-muted/30'
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <div className="flex-shrink-0 w-5">
          {hasChildren && (
            <button className="text-muted-foreground hover:text-foreground">
              {isExpanded ? <CaretDown size={20} /> : <CaretRight size={20} />}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.name}</span>
            <Badge variant="outline" className="text-xs">
              {node.type === 'detail' ? 'Деталь' : 'Этап'}
            </Badge>
          </div>

          {(node.width || node.length || node.height || node.weight) && (
            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              {node.width && <span>Ширина: {formatNumber(node.width)} мм</span>}
              {node.length && <span>Длина: {formatNumber(node.length)} мм</span>}
              {node.height && <span>Высота: {formatNumber(node.height)} мм</span>}
              {node.weight && <span>Вес: {formatNumber(node.weight)} г</span>}
            </div>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-mono font-semibold text-sm">
            {formatCurrency(node.cost, currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatPercent(node.percentage)}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
