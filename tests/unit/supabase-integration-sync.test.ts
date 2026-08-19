import { describe, it, expect } from 'vitest';
import { AppStore, MOCK_COMPANY_SUPREME } from '@/lib/store';
import { supabase } from '@/lib/supabase';

describe('Supabase Full End-to-End Persistence and Hydration', () => {
  const tenantId = 'b2000000-0000-0000-0000-000000000001';

  it('hydrates database data via AppStore.syncFromSupabase', async () => {
    const synced = await AppStore.syncFromSupabase(tenantId);
    expect(synced).toBeDefined();
    expect(synced.companies.length).toBeGreaterThan(0);
    expect(synced.profiles.length).toBeGreaterThan(0);
    expect(Array.isArray(synced.categories)).toBe(true);
    expect(synced.workflowStates.length).toBeGreaterThan(0);
  });

  it('creates and persists a customer to Supabase and hydrates it', async () => {
    const uniquePhone = `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`;
    const cust = AppStore.addCustomer({
      tenant_id: tenantId,
      name: 'Cliente Teste Sync Supabase',
      phone: uniquePhone,
      company_name: 'Empresa Teste LTDA',
      notes: 'Criado no teste de sincronização'
    });

    expect(cust.id).toBeDefined();
    expect(cust.tenant_id).toBe(tenantId);

    // Wait a brief moment for async insert to complete in Supabase
    await new Promise((r) => setTimeout(r, 600));

    // Verify in Supabase table directly
    const { data: dbCustomer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', cust.id)
      .single();

    expect(error).toBeNull();
    expect(dbCustomer).toBeDefined();
    expect(dbCustomer.name).toBe('Cliente Teste Sync Supabase');
    expect(dbCustomer.phone).toBe(uniquePhone);

    // Clean up
    AppStore.deleteCustomer(cust.id);
  });

  it('creates a service order with items and services, persisting all to Supabase', async () => {
    const cat = AppStore.addCategory({ tenant_id: tenantId, name: 'Cartuchos', slug: 'cartuchos', is_active: true });
    const brand = AppStore.addBrand({ tenant_id: tenantId, name: 'HP', slug: 'hp', is_active: true });
    await new Promise((r) => setTimeout(r, 600));

    const model = AppStore.addModel({ tenant_id: tenantId, category_id: cat.id, brand_id: brand.id, name: 'HP 664', is_active: true });
    const srv = AppStore.addService({ tenant_id: tenantId, name: 'Recarga Tinta', code: 'RECARGA', default_price: 30, is_active: true });
    const cust = AppStore.addCustomer({
      tenant_id: tenantId,
      name: 'Cliente OS Sync Supabase',
      phone: '(11) 98888-7777'
    });

    await new Promise((r) => setTimeout(r, 800));

    const newOrder = AppStore.addServiceOrder({
      tenant_id: tenantId,
      customer_id: cust.id,
      opened_by: 'd4000000-0000-0000-0000-000000000002',
      opened_by_name: 'Mariana Santos',
      assigned_technician_id: 'd4000000-0000-0000-0000-000000000003',
      assigned_technician_name: 'Rafael Souza',
      notes: 'OS de Teste com persistência Supabase',
      items: [
        {
          model_id: model.id,
          internal_identifier: 'TEST-A01',
          reported_issue: 'Falhando na impressão',
          custom_field_values: { input_weight_grams: 28.5 },
          services: [
            {
              service_id: srv.id,
              quantity: 1,
              unit_price: 30.00
            }
          ]
        }
      ],
      initial_payment: {
        amount: 30.00,
        payment_method: 'PIX'
      }
    });

    expect(newOrder.id).toBeDefined();
    expect(newOrder.items?.length).toBe(1);
    const itemId = newOrder.items![0].id;

    await new Promise((r) => setTimeout(r, 800));

    // Verify in Supabase table directly
    const { data: dbOrder, error: orderErr } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', newOrder.id)
      .single();

    expect(orderErr).toBeNull();
    expect(dbOrder).toBeDefined();
    expect(dbOrder.order_number).toBe(newOrder.order_number);

    // Verify item in Supabase table
    const { data: dbItem, error: itemErr } = await supabase
      .from('service_order_items')
      .select('*')
      .eq('id', itemId)
      .single();

    expect(itemErr).toBeNull();
    expect(dbItem).toBeDefined();
    expect(dbItem.internal_identifier).toBe('TEST-A01');

    // Update item status in bench (Bancada)
    AppStore.updateOrderItemStatus(itemId, {
      status: 'CONCLUIDO',
      result_code: 'APROVADO_100',
      technical_notes: 'Recarga efetuada com sucesso',
      custom_field_values: { output_weight_grams: 38.0 }
    });

    await new Promise((r) => setTimeout(r, 600));

    const { data: updatedDbItem } = await supabase
      .from('service_order_items')
      .select('*')
      .eq('id', itemId)
      .single();

    expect(updatedDbItem.status).toBe('CONCLUIDO');
    expect(updatedDbItem.technical_notes).toBe('Recarga efetuada com sucesso');
    expect(updatedDbItem.custom_field_values?.output_weight_grams).toBe(38.0);

    // Clean up
    AppStore.deleteServiceOrder(newOrder.id);
    AppStore.deleteCustomer(cust.id);
    AppStore.deleteModel(model.id);
    AppStore.deleteBrand(brand.id);
    AppStore.deleteCategory(cat.id);
    AppStore.deleteService(srv.id);
  });
});
