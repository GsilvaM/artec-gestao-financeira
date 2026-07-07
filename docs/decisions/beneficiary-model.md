# Beneficiary model for accounts payable

## Decision

Accounts payable use the existing application-level beneficiary fields:

- `beneficiaryType`: `supplier` or `collaborator`
- `beneficiaryId`: required only for collaborators
- `beneficiaryName`: display snapshot
- `supplier`: legacy free-text supplier name

The system does not introduce a separate `beneficiaries` table in this increment.

## Context

A previous migration already added the polymorphic beneficiary fields directly to
`accounts_payable`, and the current schema does not have a real supplier table.
Suppliers are still represented as free text inherited from existing payable
records.

Because there is no supplier entity to reference, a generic `beneficiaries`
table would either point to a missing supplier model or require broader schema
work outside this increment.

## Risk

Supplier beneficiaries do not have database-level referential integrity. A typo
or small naming variation creates a distinct supplier-like beneficiary in search
results, which can duplicate names and reduce data quality.

## Reconsider When

Revisit this decision when a real supplier table exists, or when divergent
free-text supplier names become a measurable data quality problem in reporting,
search, payments, or audits.

## Permissions Note

There is currently no separate permission distinction between creating accounts
payable for suppliers and for collaborators. Collaborator payment data can be
sensitive under LGPD, so role-based segregation for collaborator payables should
be evaluated before payroll-like usage grows.

The application already has a role/permission model through `profiles`, `roles`,
and `permissions`, plus backend helpers in `src/server/financeiro/permissions.ts`
for financial-entry permissions. A future collaborator-payable permission should
reuse that RBAC shape instead of introducing a parallel access-control model.

Using accounts payable as recurring collaborator payroll is blocked until that
segregation is designed, implemented, and tested.
