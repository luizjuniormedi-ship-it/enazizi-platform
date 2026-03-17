

## Plano: Remover item "Uploads" dos menus de navegação

Remover a entrada "📤 Uploads" da sidebar desktop e do menu mobile, sem alterar rotas ou a página em si.

### Alterações

**1. `src/components/layout/DashboardSidebar.tsx`**
- Remover `{ to: "/dashboard/uploads", icon: Upload, label: "📤 Uploads" }` do grupo "Estudo" em `navGroups`

**2. `src/components/layout/DashboardLayout.tsx`**
- Remover `{ to: "/dashboard/uploads", label: "📤 Uploads" }` do grupo "Estudo" em `mobileNavGroups`

**3. `src/test/DashboardSidebar.test.tsx`**
- Remover a asserção `expect(screen.getByText("📤 Uploads"))` do teste

