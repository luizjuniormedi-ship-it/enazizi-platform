

# Plano: Ajustar Estado Final das Feature Flags

## Estado Atual (banco)
Todas as 7 flags estão `enabled = true`. Isso inclui `new_recovery_enabled` e `new_fsrs_flow_enabled`, que **não têm efeito real** em runtime (conforme validação anterior).

## Ações

### 1. Desativar 2 flags sem efeito real
Executar via insert tool (UPDATE):
```sql
UPDATE system_flags SET enabled = false, updated_by = NULL
WHERE flag_key IN ('new_recovery_enabled', 'new_fsrs_flow_enabled');
```

Registrar auditoria:
```sql
INSERT INTO system_flag_audit (flag_key, previous_value, new_value, reason)
VALUES 
  ('new_recovery_enabled', true, false, 'Flag sem efeito real em runtime — desativada até integração completa'),
  ('new_fsrs_flow_enabled', true, false, 'Flag sem efeito real em runtime — desativada até integração completa');
```

### 2. Confirmar 5 flags que ficam ON
Estas já estão `true` no banco — nenhuma ação necessária:
- `mission_entry_enabled` — redireciona pós-login para `/mission`
- `new_planner_enabled` — aba Estratégia no SmartPlanner
- `new_tutor_flow_enabled` — dual-write tutor_sessions/tutor_messages
- `new_dashboard_snapshot_enabled` — snapshot-first no dashboard
- `new_chance_by_exam_enabled` — exibição de chance por banca

### 3. Estado final esperado

| Flag | Estado | Motivo |
|------|--------|--------|
| `mission_entry_enabled` | **ON** | Funcional — redireciona para missão |
| `new_planner_enabled` | **ON** | Funcional — controla aba estratégia |
| `new_tutor_flow_enabled` | **ON** | Funcional — dual-write tutor |
| `new_dashboard_snapshot_enabled` | **ON** | Funcional — snapshot-first |
| `new_chance_by_exam_enabled` | **ON** | Funcional — chance por banca |
| `new_recovery_enabled` | **OFF** | Sem efeito real — aguardando integração |
| `new_fsrs_flow_enabled` | **OFF** | Sem efeito real — aguardando integração |

## O que NÃO muda
- Nenhum código, rota, componente ou lógica
- Apenas 2 UPDATEs + 2 INSERTs de auditoria no banco

