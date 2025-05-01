import { UserRoleType } from '@/types/user';
// Define ConventionEquipmentStatus locally for mock/demo purposes
type ConventionEquipmentStatus = 'allocated' | 'issued' | 'returned' | 'lost';

// Define ConventionStatus locally for mock/demo purposes
type ConventionStatus = 'planning' | 'active' | 'archived';

// --- Mock Data Store ---
// Use simple in-memory store for demo purposes.
// For persistence across refreshes, localStorage could be used, but adds complexity.

let mockAssociations = [
  { id: 'assoc-1', name: 'Demo Association', description: 'A sample association for the demo.', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_email: 'demo@example.com', contact_phone: '123-456-7890', website: 'https://example.com', address: '123 Demo St' },
];

let mockProfiles = [
  { id: 'user-admin', name: 'Admin User', email: 'admin@konbase.cfd', role: 'system_admin' as UserRoleType, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), association_id: 'assoc-1', profile_image: null, two_factor_enabled: false, email_confirmed_at: new Date().toISOString() },
  { id: 'user-manager', name: 'Manager User', email: 'manager@konbase.cfd', role: 'manager' as UserRoleType, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), association_id: 'assoc-1', profile_image: null, two_factor_enabled: false, email_confirmed_at: new Date().toISOString() },
  { id: 'user-member', name: 'Member User', email: 'member@konbase.cfd', role: 'member' as UserRoleType, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), association_id: 'assoc-1', profile_image: null, two_factor_enabled: false, email_confirmed_at: new Date().toISOString() },
];

let mockCategories = [
  { id: 'cat-1', name: 'Electronics', description: 'Electronic devices', association_id: 'assoc-1', parent_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Furniture', description: 'Office furniture', association_id: 'assoc-1', parent_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', name: 'AV Equipment', description: 'Audio/Visual gear', association_id: 'assoc-1', parent_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Cables', description: 'Various cables', association_id: 'assoc-1', parent_id: 'cat-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Stationery', description: 'Office supplies', association_id: 'assoc-1', parent_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let mockLocations = [
  { id: 'loc-1', name: 'Main Office', description: 'Primary office space', association_id: 'assoc-1', parent_id: null, is_room: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-2', name: 'Storage Room', description: 'Storage area', association_id: 'assoc-1', parent_id: 'loc-1', is_room: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-3', name: 'Conference Hall', description: 'Large event space', association_id: 'assoc-1', parent_id: null, is_room: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-4', name: 'Panel Room A', description: 'Small presentation room', association_id: 'assoc-1', parent_id: 'loc-3', is_room: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-5', name: 'Booth Area 1', description: 'Exhibitor booth space', association_id: 'assoc-1', parent_id: 'loc-3', is_room: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let mockItems = [
  { id: 'item-1', name: 'Laptop', description: 'Standard issue laptop', serial_number: 'LAP123', barcode: 'BC123', condition: 'good', category_id: 'cat-1', location_id: 'loc-1', association_id: 'assoc-1', quantity: 1, is_consumable: false, minimum_quantity: null, purchase_price: 1200, purchase_date: '2023-01-15', warranty_expiration: '2026-01-15', notes: 'Assigned to Admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
  { id: 'item-2', name: 'Office Chair', description: 'Ergonomic chair', serial_number: null, barcode: 'BC456', condition: 'new', category_id: 'cat-2', location_id: 'loc-1', association_id: 'assoc-1', quantity: 1, is_consumable: false, minimum_quantity: null, purchase_price: 300, purchase_date: '2023-02-20', warranty_expiration: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
  { id: 'item-3', name: 'Keyboard', description: 'Wireless Keyboard', serial_number: 'KB789', barcode: 'BC789', condition: 'good', category_id: 'cat-1', location_id: 'loc-2', association_id: 'assoc-1', quantity: 5, is_consumable: true, minimum_quantity: 2, purchase_price: 75, purchase_date: '2023-03-10', warranty_expiration: null, notes: 'Spare keyboards', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
  { id: 'item-4', name: 'Projector', description: 'HD Projector', serial_number: 'PROJ456', barcode: 'BCPROJ', condition: 'good', category_id: 'cat-3', location_id: 'loc-2', association_id: 'assoc-1', quantity: 3, is_consumable: false, minimum_quantity: null, purchase_price: 800, purchase_date: '2023-04-01', warranty_expiration: '2025-04-01', notes: 'Includes remote', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
  { id: 'item-5', name: 'HDMI Cable (10m)', description: 'Long HDMI cable', serial_number: null, barcode: 'BCHDMI10', condition: 'new', category_id: 'cat-4', location_id: 'loc-2', association_id: 'assoc-1', quantity: 20, is_consumable: true, minimum_quantity: 5, purchase_price: 15, purchase_date: '2023-05-01', warranty_expiration: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
  { id: 'item-6', name: 'Microphone', description: 'Wireless handheld mic', serial_number: 'MIC789', barcode: 'BCMIC', condition: 'good', category_id: 'cat-3', location_id: 'loc-2', association_id: 'assoc-1', quantity: 4, is_consumable: false, minimum_quantity: null, purchase_price: 250, purchase_date: '2023-06-01', warranty_expiration: null, notes: 'Requires AA batteries', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
  { id: 'item-7', name: 'Badges (Pack of 100)', description: 'Blank attendee badges', serial_number: null, barcode: 'BCBADGE', condition: 'new', category_id: 'cat-5', location_id: 'loc-1', association_id: 'assoc-1', quantity: 10, is_consumable: true, minimum_quantity: 2, purchase_price: 20, purchase_date: '2023-07-01', warranty_expiration: null, notes: 'Standard size', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), image: null },
];

let mockDocuments = [
    { id: 'doc-1', name: 'Laptop Warranty', file_type: 'application/pdf', file_url: '/docs/placeholder.pdf', item_id: 'item-1', uploaded_by: 'user-admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let mockAuditLogs = [
    { id: 'log-1', action: 'login', entity: 'auth', entity_id: 'user-admin', user_id: 'user-admin', changes: { ip: '127.0.0.1' }, created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
];

let mockNotifications = [
    { id: 'notif-1', user_id: 'user-admin', title: 'Welcome!', message: 'Welcome to the KonBase demo.', read: false, created_at: new Date(Date.now() - 60000).toISOString(), link: '/dashboard' },
    { id: 'notif-2', user_id: 'user-manager', title: 'New Item Added', message: 'A new Laptop was added to inventory.', read: true, created_at: new Date(Date.now() - 120000).toISOString(), link: '/inventory/items' },
    { id: 'notif-3', user_id: 'user-admin', title: 'Low Stock Alert', message: 'Keyboards are running low (3 remaining).', read: false, created_at: new Date().toISOString(), link: '/inventory/items/item-3' },
];

let mockAssociationInvitations = [
    { id: 'inv-assoc-1', code: 'ASSOC123', association_id: 'assoc-1', role: 'member' as UserRoleType, created_by: 'user-admin', used: false, used_by: null, used_at: null, created_at: new Date().toISOString() },
    { id: 'inv-assoc-2', code: 'ASSOCMGR', association_id: 'assoc-1', role: 'manager' as UserRoleType, created_by: 'user-admin', used: false, used_by: null, used_at: null, created_at: new Date().toISOString() },
];

let mockConventionInvitations = [
    { id: 'inv-conv-1', code: 'CONV123', convention_id: 'conv-1', role: 'member' as UserRoleType, created_by: 'user-manager', uses_remaining: 10, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() }, // Expires in 7 days
    { id: 'inv-conv-2', code: 'CONVVIP', convention_id: 'conv-1', role: 'manager' as UserRoleType, created_by: 'user-manager', uses_remaining: 1, expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() }, // Single use, expires soon
    { id: 'inv-conv-3', code: 'EXPOPASS', convention_id: 'conv-2', role: 'member' as UserRoleType, created_by: 'user-manager', uses_remaining: 50, expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() }, // Expires in 60 days
];

let mockConventions = [
    { id: 'conv-1', name: 'Annual Demo Con 2024', description: 'The main demonstration convention for the year.', start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(), status: 'planning' as ConventionStatus, association_id: 'assoc-1', created_by: 'user-manager', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'conv-active', name: 'KonBase Live Demo Event', description: 'Currently active convention for demonstration.', start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' as ConventionStatus, association_id: 'assoc-1', created_by: 'user-admin', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }, // Active Convention
    { id: 'conv-2', name: 'Summer Tech Expo', description: 'Showcasing new technology.', start_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 92 * 24 * 60 * 60 * 1000).toISOString(), status: 'planning' as ConventionStatus, association_id: 'assoc-1', created_by: 'user-manager', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'conv-archived', name: 'Past Con 2023', description: 'An archived convention.', start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() - 362 * 24 * 60 * 60 * 1000).toISOString(), status: 'archived' as ConventionStatus, association_id: 'assoc-1', created_by: 'user-manager', created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString() },
];

let mockConventionLocations = [
    { id: 'convloc-1', convention_id: 'conv-1', location_id: 'loc-3', name_override: 'Main Hall', description_override: 'Primary convention area', created_at: new Date().toISOString() },
    { id: 'convloc-2', convention_id: 'conv-1', location_id: 'loc-4', name_override: 'Panel Room A', description_override: 'Booth for tech support', created_at: new Date().toISOString() },
    { id: 'convloc-3', convention_id: 'conv-2', location_id: 'loc-3', name_override: 'Expo Floor', description_override: null, created_at: new Date().toISOString() },
    // Locations for Active Convention
    { id: 'convloc-active-1', convention_id: 'conv-active', location_id: 'loc-3', name_override: 'Live Demo Hall', description_override: 'Main stage and demo area', created_at: new Date().toISOString() },
    { id: 'convloc-active-2', convention_id: 'conv-active', location_id: 'loc-4', name_override: 'Workshop Room', description_override: 'Hands-on sessions', created_at: new Date().toISOString() },
    { id: 'convloc-active-3', convention_id: 'conv-active', location_id: 'loc-5', name_override: 'Info Booth', description_override: 'Information and support', created_at: new Date().toISOString() },
    { id: 'convloc-active-storage', convention_id: 'conv-active', location_id: 'loc-2', name_override: 'On-Site Storage', description_override: 'Temporary storage during event', created_at: new Date().toISOString() },
];

let mockConventionEquipment = [
    { id: 'conveqp-1', convention_id: 'conv-1', item_id: 'item-1', quantity: 1, convention_location_id: 'convloc-1', status: 'allocated' as ConventionEquipmentStatus, issued_by: null, issued_at: null, returned_by: null, returned_at: null, notes: 'For registration desk', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'conveqp-2', convention_id: 'conv-1', item_id: 'item-4', quantity: 2, convention_location_id: 'convloc-2', status: 'allocated' as ConventionEquipmentStatus, issued_by: null, issued_at: null, returned_by: null, returned_at: null, notes: 'For Panel Room A', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    // Equipment for Active Convention
    { id: 'conveqp-active-1', convention_id: 'conv-active', item_id: 'item-1', quantity: 1, convention_location_id: 'convloc-active-3', status: 'issued' as ConventionEquipmentStatus, issued_by: 'user-admin', issued_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), returned_by: null, returned_at: null, notes: 'Info Booth Laptop', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'conveqp-active-2', convention_id: 'conv-active', item_id: 'item-4', quantity: 1, convention_location_id: 'convloc-active-1', status: 'issued' as ConventionEquipmentStatus, issued_by: 'user-admin', issued_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), returned_by: null, returned_at: null, notes: 'Main Stage Projector', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'conveqp-active-3', convention_id: 'conv-active', item_id: 'item-6', quantity: 2, convention_location_id: 'convloc-active-1', status: 'allocated' as ConventionEquipmentStatus, issued_by: null, issued_at: null, returned_by: null, returned_at: null, notes: 'Stage Microphones', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'conveqp-active-4', convention_id: 'conv-active', item_id: 'item-2', quantity: 5, convention_location_id: 'convloc-active-2', status: 'allocated' as ConventionEquipmentStatus, issued_by: null, issued_at: null, returned_by: null, returned_at: null, notes: 'Workshop Chairs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let mockConventionAccess = [
    { id: 'convacc-1', convention_id: 'conv-1', user_id: 'user-manager', role: 'manager' as UserRoleType, created_at: new Date().toISOString() },
    { id: 'convacc-2', convention_id: 'conv-1', user_id: 'user-member', role: 'member' as UserRoleType, created_at: new Date().toISOString() },
    { id: 'convacc-3', convention_id: 'conv-2', user_id: 'user-manager', role: 'manager' as UserRoleType, created_at: new Date().toISOString() },
    // Access for Active Convention
    { id: 'convacc-active-1', convention_id: 'conv-active', user_id: 'user-admin', role: 'manager' as UserRoleType, created_at: new Date().toISOString() }, // Admin is manager here
    { id: 'convacc-active-2', convention_id: 'conv-active', user_id: 'user-manager', role: 'member' as UserRoleType, created_at: new Date().toISOString() }, // Manager is member here
    { id: 'convacc-active-3', convention_id: 'conv-active', user_id: 'user-member', role: 'member' as UserRoleType, created_at: new Date().toISOString() },
];

let mockConventionRequirements = [
    { id: 'convreq-1', convention_id: 'conv-1', description: 'Need 2 projectors', status: 'pending', assigned_to: 'user-manager', due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    // Requirements for Active Convention
    { id: 'convreq-active-1', convention_id: 'conv-active', description: 'Set up main stage AV', status: 'completed', assigned_to: 'user-admin', due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'convreq-active-2', convention_id: 'conv-active', description: 'Prepare workshop materials', status: 'in_progress', assigned_to: 'user-manager', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'convreq-active-3', convention_id: 'conv-active', description: 'Arrange signage', status: 'pending', assigned_to: null, due_date: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
];

let mockConventionConsumables = [
    { id: 'convcons-1', convention_id: 'conv-1', item_id: 'item-5', allocated_quantity: 10, used_quantity: 0, convention_location_id: 'convloc-2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    // Consumables for Active Convention
    { id: 'convcons-active-1', convention_id: 'conv-active', item_id: 'item-7', allocated_quantity: 5, used_quantity: 2, convention_location_id: 'convloc-active-3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, // 5 packs allocated, 2 used
    { id: 'convcons-active-2', convention_id: 'conv-active', item_id: 'item-5', allocated_quantity: 5, used_quantity: 1, convention_location_id: 'convloc-active-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, // 5 HDMI cables allocated, 1 used
];

let mockConventionTemplates = [
    { id: 'convtmpl-1', name: 'Standard Conference Template', description: 'Basic template for conferences', association_id: 'assoc-1', created_by: 'user-admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let mockConventionLogs = [
    { id: 'convlog-1', convention_id: 'conv-1', user_id: 'user-manager', log_message: 'Created convention.', created_at: new Date().toISOString() },
    { id: 'convlog-2', convention_id: 'conv-1', user_id: 'user-manager', log_message: 'Allocated 1x "Laptop" to Main Hall.', created_at: new Date().toISOString() }, // Updated log message
    // Logs for Active Convention
    { id: 'convlog-active-1', convention_id: 'conv-active', user_id: 'user-admin', log_message: 'Created convention "KonBase Live Demo Event".', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'convlog-active-2', convention_id: 'conv-active', user_id: 'user-admin', log_message: 'Changed status of "Laptop" from allocated to issued.', created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }, // Updated log message
    { id: 'convlog-active-3', convention_id: 'conv-active', user_id: 'user-admin', log_message: 'Changed status of "Projector" from allocated to issued.', created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() }, // Updated log message
    { id: 'convlog-active-4', convention_id: 'conv-active', user_id: 'user-manager', log_message: 'Updated requirement "Prepare workshop materials" status to in_progress.', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }, // Updated log message
    { id: 'convlog-active-5', convention_id: 'conv-active', user_id: 'user-member', log_message: 'Recorded usage of 1x "Badges (Pack of 100)" (Total used: 2).', created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }, // Updated log message
];

// --- NEW: Equipment Sets ---
let mockEquipmentSets = [
    { id: 'set-1', name: 'Standard Panel Room Kit', description: 'Basic AV setup for a panel room', association_id: 'assoc-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'set-2', name: 'Registration Desk Kit', description: 'Laptop, printer, badge supplies', association_id: 'assoc-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let mockEquipmentSetItems = [
    // Set 1: Panel Room Kit
    { id: 'setitem-1', set_id: 'set-1', item_id: 'item-4', quantity: 1 }, // 1 Projector
    { id: 'setitem-2', set_id: 'set-1', item_id: 'item-6', quantity: 2 }, // 2 Microphones
    { id: 'setitem-3', set_id: 'set-1', item_id: 'item-5', quantity: 2 }, // 2 HDMI Cables
    // Set 2: Registration Desk Kit
    { id: 'setitem-4', set_id: 'set-2', item_id: 'item-1', quantity: 1 }, // 1 Laptop
    { id: 'setitem-5', set_id: 'set-2', item_id: 'item-7', quantity: 2 }, // 2 Packs of Badges
];


// --- Helper Functions ---

const findById = (store: any[], id: string) => store.find(item => item.id === id);
const filterBy = (store: any[], key: string, value: any) => store.filter(item => item[key] === value);

const applyFilters = (store: any[], filters: { column: string; value: any }[]) => {
    let result = [...store];
    filters.forEach(filter => {
        result = result.filter(item => item[filter.column] === filter.value);
    });
    return result;
};

const applyOrFilters = (store: any[], filterString: string, limit?: number) => {
    // Basic ILIKE simulation for demo
    const conditions = filterString.split(',');
    const results = new Set();
    conditions.forEach(condition => {
        const [columnPart, operator, valuePart] = condition.split('.');
        const column = columnPart.trim();
        const value = valuePart.trim().replace(/%/g, '').toLowerCase(); // Remove % and make lowercase

        store.forEach(item => {
            if (item[column] && typeof item[column] === 'string' && item[column].toLowerCase().includes(value)) {
                results.add(item);
            }
        });
    });

    let finalResults = Array.from(results);
    if (limit) {
        finalResults = finalResults.slice(0, limit);
    }
    return finalResults;
};


const applyInFilter = (store: any[], column: string, values: any[]) => {
    return store.filter(item => values.includes(item[column]));
};

const generateId = () => `mock-${crypto.randomUUID()}`;

// --- Mock Table Operations ---

export const mockDb = {
    associations: {
        getAll: () => [...mockAssociations],
        getById: (id: string) => findById(mockAssociations, id),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockAssociations.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockAssociations = mockAssociations.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockAssociations, id);
        },
        delete: (id: string) => {
            mockAssociations = mockAssociations.filter(item => item.id !== id);
            return true;
        },
    },
    profiles: {
        getAll: () => [...mockProfiles],
        getById: (id: string) => findById(mockProfiles, id),
        getByEmail: (email: string) => mockProfiles.find(p => p.email === email),
        getByAssociation: (assocId: string) => filterBy(mockProfiles, 'association_id', assocId),
        insert: (newData: any) => {
            const newItem = { ...newData, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), email_confirmed_at: new Date().toISOString() }; // ID comes from auth user
            mockProfiles.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            let updatedProfile = null;
            mockProfiles = mockProfiles.map(item => {
                if (item.id === id) {
                    // Ensure boolean value is correctly handled
                    const newUpdates = {
                        ...updates,
                        two_factor_enabled: typeof updates.two_factor_enabled === 'boolean'
                            ? updates.two_factor_enabled
                            : item.two_factor_enabled // Keep existing if not provided or invalid
                    };
                    updatedProfile = { ...item, ...newUpdates, updated_at: new Date().toISOString() };
                    console.log(`[Mock] Updating profile ${id}:`, newUpdates, 'Result:', updatedProfile); // Add log
                    return updatedProfile;
                }
                return item;
            });
            return updatedProfile; // Return the updated profile object
        },
        delete: (id: string) => {
            mockProfiles = mockProfiles.filter(item => item.id !== id);
            return true;
        },
    },
    categories: {
        getAll: () => [...mockCategories],
        getById: (id: string) => findById(mockCategories, id),
        getByAssociation: (assocId: string) => filterBy(mockCategories, 'association_id', assocId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockCategories.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockCategories = mockCategories.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockCategories, id);
        },
        delete: (id: string) => {
            mockCategories = mockCategories.filter(item => item.id !== id);
            return true;
        },
    },
    locations: {
        getAll: () => [...mockLocations],
        getById: (id: string) => findById(mockLocations, id),
        getByAssociation: (assocId: string) => filterBy(mockLocations, 'association_id', assocId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockLocations.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockLocations = mockLocations.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockLocations, id);
        },
        delete: (id: string) => {
            // Basic check: prevent deleting location if items are assigned
            if (mockItems.some(item => item.location_id === id)) {
                throw new Error('Cannot delete location with assigned items.');
            }
            mockLocations = mockLocations.filter(item => item.id !== id);
            return true;
        },
    },
    items: {
        getAll: () => [...mockItems],
        getById: (id: string) => findById(mockItems, id),
        getByAssociation: (assocId: string) => filterBy(mockItems, 'association_id', assocId),
        getByLocation: (locId: string) => filterBy(mockItems, 'location_id', locId),
        getByCategory: (catId: string) => filterBy(mockItems, 'category_id', catId),
        filter: (filters: { column: string; value: any }[]) => applyFilters(mockItems, filters),
        filterOr: (filterString: string, limit?: number) => applyOrFilters(mockItems, filterString, limit),
        filterIn: (column: string, values: any[]) => applyInFilter(mockItems, column, values),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockItems.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockItems = mockItems.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockItems, id);
        },
        delete: (id: string) => {
            // Also delete related documents for demo simplicity
            mockDocuments = mockDocuments.filter(doc => doc.item_id !== id);
            mockItems = mockItems.filter(item => item.id !== id);
            return true;
        },
        countByLocation: (locId: string) => filterBy(mockItems, 'location_id', locId).length,
    },
    documents: {
        getAll: () => [...mockDocuments],
        getById: (id: string) => findById(mockDocuments, id),
        getByItemId: (itemId: string) => filterBy(mockDocuments, 'item_id', itemId),
        filterOr: (filterString: string, limit?: number) => applyOrFilters(mockDocuments, filterString, limit),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockDocuments.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockDocuments = mockDocuments.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockDocuments, id);
        },
        delete: (id: string) => {
            mockDocuments = mockDocuments.filter(item => item.id !== id);
            return true;
        },
    },
    audit_logs: {
        getAll: () => [...mockAuditLogs],
        getByUser: (userId: string) => filterBy(mockAuditLogs, 'user_id', userId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString() };
            mockAuditLogs.push(newItem);
            console.log("Audit Log:", newItem); // Log audit events for demo
            return newItem;
        },
         deleteByUser: (userId: string) => {
            mockAuditLogs = mockAuditLogs.filter(log => log.user_id !== userId);
            return true;
        },
    },
     association_members: (() => {
        // Define members array within a closure
        const members = [{ user_id: 'user-admin', association_id: 'assoc-1' }, { user_id: 'user-manager', association_id: 'assoc-1' }, { user_id: 'user-member', association_id: 'assoc-1' }];

        return {
            // Simplified: Just track which users are in which associations
            // Optionally expose members if needed externally: getMembers: () => [...members],
            getByUser: (userId: string) => members.filter((m: any) => m.user_id === userId),
            insert: (newData: any) => {
                // Access members directly from the closure
                if (!members.some((m: any) => m.user_id === newData.user_id && m.association_id === newData.association_id)) {
                    members.push(newData);
                }
                return newData;
            },
            deleteByUser: (userId: string) => {
                // Access members directly from the closure
                const initialLength = members.length;
                // Filter creates a new array, reassign to update the closed-over 'members'
                const filteredMembers = members.filter((m: any) => m.user_id !== userId);
                // Modify the array in place to reflect deletion within the closure
                members.length = 0; // Clear original array
                members.push(...filteredMembers); // Add back filtered items
                return members.length < initialLength; // Return true if items were removed
            }
        };
     })(), // Immediately invoke the function to create the object
    // Add other tables as needed (conventions, notifications, etc.) following the same pattern
    notifications: {
        getAll: () => [...mockNotifications],
        getById: (id: string) => findById(mockNotifications, id),
        getByUser: (userId: string) => filterBy(mockNotifications, 'user_id', userId),
        filter: (filters: { column: string; value: any }[]) => applyFilters(mockNotifications, filters),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), read: false };
            mockNotifications.unshift(newItem); // Add to the beginning
            mockNotifications = mockNotifications.slice(0, 50); // Keep max 50 notifications for demo
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockNotifications = mockNotifications.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockNotifications, id);
        },
        delete: (id: string) => {
            mockNotifications = mockNotifications.filter(item => item.id !== id);
            return true;
        },
        // Specific helper for marking multiple as read
        markMultipleAsRead: (userId: string, ids: string[]) => {
            let updatedCount = 0;
            mockNotifications = mockNotifications.map(item => {
                if (item.user_id === userId && ids.includes(item.id) && !item.read) {
                    updatedCount++;
                    return { ...item, read: true, updated_at: new Date().toISOString() };
                }
                return item;
            });
            return updatedCount;
        }
    },
    module_manifests: {
        getAll: () => [], // Return empty for demo or add mock manifests
        upsert: (data: any) => { console.log("Mock upsert module_manifests:", data); return data; }
    },
    module_configurations: {
        getById: (id: string) => ({ module_id: id, settings: {}, last_updated: new Date().toISOString() }), // Return default config
        upsert: (data: any) => { console.log("Mock upsert module_configurations:", data); return data; }
    },
    module_migrations: {
        getByModule: (moduleId: string) => [], // Return empty, no migrations applied in demo
        insert: (data: any) => { console.log("Mock insert module_migrations:", data); return data; }
    },
    user_2fa: {
        // Return a default state (e.g., not enabled) for any requested user ID in demo mode
        getById: (userId: string) => {
            console.log(`[Mock] Checking 2FA for user ${userId}. Returning default (disabled).`);
            // Find the profile to potentially link 2FA status later if needed
            const profile = findById(mockProfiles, userId);
            // Simulate 2FA being disabled for all demo users by default
            return { 
                user_id: userId, 
                is_enabled: false, // Default to false
                secret: 'MOCKSECRET1234567890', // Placeholder secret
                created_at: profile?.created_at || new Date().toISOString() 
            };
        },
        insert: (data: any) => { console.log("Mock insert user_2fa:", data); return { ...data, is_enabled: true }; }, // Simulate enabling
        update: (userId: string, data: any) => { console.log("Mock update user_2fa:", userId, data); return { user_id: userId, ...data }; },
        delete: (userId: string) => { console.log("Mock delete user_2fa:", userId); return true; } // Simulate disabling
    },
    // Add mock operations for association_invitations
    association_invitations: {
        getAll: () => [...mockAssociationInvitations],
        getById: (id: string) => findById(mockAssociationInvitations, id),
        getByCode: (code: string) => mockAssociationInvitations.find(inv => inv.code === code),
        filter: (filters: { column: string; value: any }[]) => applyFilters(mockAssociationInvitations, filters),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), used: false, used_by: null, used_at: null };
            mockAssociationInvitations.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockAssociationInvitations = mockAssociationInvitations.map(item =>
                item.id === id ? { ...item, ...updates } : item // No updated_at in schema?
            );
            return findById(mockAssociationInvitations, id);
        },
        delete: (id: string) => {
            mockAssociationInvitations = mockAssociationInvitations.filter(item => item.id !== id);
            return true;
        },
    },
    // Add mock operations for convention_invitations
    convention_invitations: {
        getAll: () => [...mockConventionInvitations],
        getById: (id: string) => findById(mockConventionInvitations, id),
        getByCode: (code: string) => mockConventionInvitations.find(inv => inv.code === code),
        filter: (filters: { column: string; value: any }[]) => applyFilters(mockConventionInvitations, filters),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString() };
            mockConventionInvitations.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockConventionInvitations = mockConventionInvitations.map(item =>
                item.id === id ? { ...item, ...updates } : item // No updated_at in schema?
            );
            return findById(mockConventionInvitations, id);
        },
        delete: (id: string) => {
            mockConventionInvitations = mockConventionInvitations.filter(item => item.id !== id);
            return true;
        },
    },
    // Add mock operations for convention_access (needed when processing convention invitation)
    convention_access: {
        getAll: () => [...mockConventionAccess],
        getByUserAndConvention: (userId: string, conventionId: string) => mockConventionAccess.find(a => a.user_id === userId && a.convention_id === conventionId),
        getByConvention: (convId: string) => filterBy(mockConventionAccess, 'convention_id', convId),
        getByUser: (userId: string) => filterBy(mockConventionAccess, 'user_id', userId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString() };
            mockConventionAccess.push(newItem);
            console.log("Mock insert convention_access:", newItem);
            // Add log entry
            const userName = findById(mockProfiles, newData.user_id)?.name || 'Unknown User';
            mockDb.convention_logs.insert({ convention_id: newData.convention_id, user_id: 'user-system', log_message: `Added ${userName} to convention with role ${newData.role}.` });
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockConventionAccess = mockConventionAccess.map(item =>
                item.id === id ? { ...item, ...updates } : item
            );
            return findById(mockConventionAccess, id);
        },
        delete: (id: string) => {
            const item = findById(mockConventionAccess, id);
            if (item) {
                mockConventionAccess = mockConventionAccess.filter(item => item.id !== id);
                // Add log entry
                const userName = findById(mockProfiles, item.user_id)?.name || 'Unknown User';
                mockDb.convention_logs.insert({ convention_id: item.convention_id, user_id: 'user-system', log_message: `Removed ${userName} from convention.` });
            }
            return true;
        },
    },
    conventions: {
        getAll: () => [...mockConventions],
        getById: (id: string) => findById(mockConventions, id),
        getByAssociation: (assocId: string) => filterBy(mockConventions, 'association_id', assocId),
        filter: (filters: { column: string; value: any }[]) => applyFilters(mockConventions, filters),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockConventions.push(newItem);
            // Add log entry
            mockDb.convention_logs.insert({ convention_id: newItem.id, user_id: newData.created_by || 'user-system', log_message: `Created convention "${newItem.name}".` });
            return newItem;
        },
        update: (id: string, updates: any) => {
            let oldItem: any = null;
            mockConventions = mockConventions.map(item => {
                if (item.id === id) {
                    oldItem = { ...item };
                    return { ...item, ...updates, updated_at: new Date().toISOString() };
                }
                return item;
            });
            const newItem = findById(mockConventions, id);
            // Add log entry for status change
            if (oldItem && newItem && oldItem.status !== newItem.status) {
                 mockDb.convention_logs.insert({ convention_id: id, user_id: 'user-system', log_message: `Convention status changed from ${oldItem.status} to ${newItem.status}.` });
            }
            return newItem;
        },
        delete: (id: string) => {
            // Add checks if needed (e.g., cannot delete if active)
            const convention = findById(mockConventions, id);
            if (convention?.status === 'active') {
                throw new Error("Cannot delete an active convention.");
            }
            mockConventions = mockConventions.filter(item => item.id !== id);
            // Cascade delete related mock data (optional, for demo cleanup)
            mockConventionLocations = mockConventionLocations.filter(l => l.convention_id !== id);
            mockConventionEquipment = mockConventionEquipment.filter(e => e.convention_id !== id);
            mockConventionAccess = mockConventionAccess.filter(a => a.convention_id !== id);
            mockConventionRequirements = mockConventionRequirements.filter(r => r.convention_id !== id);
            mockConventionConsumables = mockConventionConsumables.filter(c => c.convention_id !== id);
            mockConventionLogs = mockConventionLogs.filter(log => log.convention_id !== id);
            return true;
        },
    },
    convention_locations: {
        getAll: () => [...mockConventionLocations],
        getByConvention: (convId: string) => filterBy(mockConventionLocations, 'convention_id', convId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString() };
            mockConventionLocations.push(newItem);
            // Add log entry
            const locName = findById(mockLocations, newData.location_id)?.name || 'Unknown Location';
            mockDb.convention_logs.insert({ convention_id: newData.convention_id, user_id: 'user-system', log_message: `Added location "${newData.name_override || locName}" to convention.` });
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockConventionLocations = mockConventionLocations.map(item =>
                item.id === id ? { ...item, ...updates } : item
            );
            return findById(mockConventionLocations, id);
        },
        delete: (id: string) => {
            const item = findById(mockConventionLocations, id);
            if (item) {
                 // Check if equipment/consumables are assigned here
                 if (mockConventionEquipment.some(e => e.convention_location_id === id) || mockConventionConsumables.some(c => c.convention_location_id === id)) {
                     throw new Error("Cannot delete location with assigned equipment or consumables.");
                 }
                 mockConventionLocations = mockConventionLocations.filter(item => item.id !== id);
                 // Add log entry
                 mockDb.convention_logs.insert({ convention_id: item.convention_id, user_id: 'user-system', log_message: `Removed location "${item.name_override}" from convention.` });
            }
            return true;
        },
    },
    convention_equipment: {
        getAll: () => [...mockConventionEquipment],
        getByConvention: (convId: string) => filterBy(mockConventionEquipment, 'convention_id', convId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: 'allocated' as ConventionEquipmentStatus }; // Default status
            mockConventionEquipment.push(newItem);
            // Add log entry
            const itemName = findById(mockItems, newData.item_id)?.name || 'Unknown Item';
            const locName = findById(mockConventionLocations, newData.convention_location_id)?.name_override || 'Storage';
            mockDb.convention_logs.insert({ convention_id: newData.convention_id, user_id: 'user-system', log_message: `Allocated ${newData.quantity}x "${itemName}" to ${locName}.` });
            return newItem;
        },
        update: (id: string, updates: any) => {
            let oldItem: any = null;
            mockConventionEquipment = mockConventionEquipment.map(item => {
                if (item.id === id) {
                    oldItem = { ...item };
                    return { ...item, ...updates, updated_at: new Date().toISOString() };
                }
                return item;
            });
            const newItem = findById(mockConventionEquipment, id);
            // Add log entry for status change
            if (oldItem && newItem && oldItem.status !== newItem.status) {
                 const itemName = findById(mockItems, newItem.item_id)?.name || 'Unknown Item';
                 const userId = updates.issued_by || updates.returned_by || 'user-system';
                 mockDb.convention_logs.insert({ convention_id: newItem.convention_id, user_id: userId, log_message: `Changed status of "${itemName}" from ${oldItem.status} to ${newItem.status}.` });
            }
            return newItem;
        },
        delete: (id: string) => {
            const item = findById(mockConventionEquipment, id);
            if (item) {
                mockConventionEquipment = mockConventionEquipment.filter(item => item.id !== id);
                // Add log entry
                const itemName = findById(mockItems, item.item_id)?.name || 'Unknown Item';
                mockDb.convention_logs.insert({ convention_id: item.convention_id, user_id: 'user-system', log_message: `Removed allocation of "${itemName}" from convention.` });
            }
            return true;
        },
    },
    convention_requirements: {
        getAll: () => [...mockConventionRequirements],
        getByConvention: (convId: string) => filterBy(mockConventionRequirements, 'convention_id', convId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), status: 'pending' };
            mockConventionRequirements.push(newItem);
            // Add log entry
            mockDb.convention_logs.insert({ convention_id: newData.convention_id, user_id: 'user-system', log_message: `Added requirement: "${newData.description}".` });
            return newItem;
        },
        update: (id: string, updates: any) => {
            let oldItem: any = null;
            mockConventionRequirements = mockConventionRequirements.map(item => {
                 if (item.id === id) {
                    oldItem = { ...item };
                    return { ...item, ...updates };
                 }
                 return item;
            });
             const newItem = findById(mockConventionRequirements, id);
            // Add log entry for status change
            if (oldItem && newItem && oldItem.status !== newItem.status) {
                 mockDb.convention_logs.insert({ convention_id: newItem.convention_id, user_id: 'user-system', log_message: `Updated requirement "${newItem.description}" status to ${newItem.status}.` });
            }
            return newItem;
        },
        delete: (id: string) => {
            const item = findById(mockConventionRequirements, id);
             if (item) {
                mockConventionRequirements = mockConventionRequirements.filter(item => item.id !== id);
                // Add log entry
                mockDb.convention_logs.insert({ convention_id: item.convention_id, user_id: 'user-system', log_message: `Removed requirement: "${item.description}".` });
             }
            return true;
        },
    },
    convention_consumables: {
        getAll: () => [...mockConventionConsumables],
        getByConvention: (convId: string) => filterBy(mockConventionConsumables, 'convention_id', convId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), used_quantity: 0 }; // Start with 0 used
            mockConventionConsumables.push(newItem);
            // Add log entry
            const itemName = findById(mockItems, newData.item_id)?.name || 'Unknown Consumable';
            mockDb.convention_logs.insert({ convention_id: newData.convention_id, user_id: 'user-system', log_message: `Allocated ${newData.allocated_quantity}x "${itemName}" to convention.` });
            return newItem;
        },
        update: (id: string, updates: any) => {
            let oldItem: any = null;
            mockConventionConsumables = mockConventionConsumables.map(item => {
                if (item.id === id) {
                    oldItem = { ...item };
                    return { ...item, ...updates, updated_at: new Date().toISOString() };
                }
                return item;
            });
            const newItem = findById(mockConventionConsumables, id);
             // Add log entry for usage change
            if (oldItem && newItem && oldItem.used_quantity !== newItem.used_quantity) {
                 const itemName = findById(mockItems, newItem.item_id)?.name || 'Unknown Consumable';
                 const diff = newItem.used_quantity - oldItem.used_quantity;
                 mockDb.convention_logs.insert({ convention_id: newItem.convention_id, user_id: updates.used_by || 'user-system', log_message: `Recorded usage of ${diff > 0 ? diff : -diff}x "${itemName}" (Total used: ${newItem.used_quantity}).` });
            }
            return newItem;
        },
        delete: (id: string) => {
             const item = findById(mockConventionConsumables, id);
             if (item) {
                mockConventionConsumables = mockConventionConsumables.filter(item => item.id !== id);
                // Add log entry
                const itemName = findById(mockItems, item.item_id)?.name || 'Unknown Consumable';
                mockDb.convention_logs.insert({ convention_id: item.convention_id, user_id: 'user-system', log_message: `Removed allocation of "${itemName}" from convention.` });
             }
            return true;
        },
    },
    convention_templates: {
        getAll: () => [...mockConventionTemplates],
        getById: (id: string) => findById(mockConventionTemplates, id),
        getByAssociation: (assocId: string) => filterBy(mockConventionTemplates, 'association_id', assocId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockConventionTemplates.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockConventionTemplates = mockConventionTemplates.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockConventionTemplates, id);
        },
        delete: (id: string) => {
            mockConventionTemplates = mockConventionTemplates.filter(item => item.id !== id);
            return true;
        },
    },
    convention_logs: {
        getAll: () => [...mockConventionLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), // Sort descending
        getByConvention: (convId: string) => filterBy(mockConventionLogs, 'convention_id', convId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString() };
            mockConventionLogs.push(newItem);
            return newItem;
        },
        // Delete might not be common for logs
    },
    // --- NEW: Equipment Sets Operations ---
    equipment_sets: {
        getAll: () => [...mockEquipmentSets],
        getById: (id: string) => findById(mockEquipmentSets, id),
        getByAssociation: (assocId: string) => filterBy(mockEquipmentSets, 'association_id', assocId),
        insert: (newData: any) => {
            const newItem = { ...newData, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockEquipmentSets.push(newItem);
            return newItem;
        },
        update: (id: string, updates: any) => {
            mockEquipmentSets = mockEquipmentSets.map(item =>
                item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );
            return findById(mockEquipmentSets, id);
        },
        delete: (id: string) => {
            // Also delete related set items
            mockEquipmentSetItems = mockEquipmentSetItems.filter(si => si.set_id !== id);
            mockEquipmentSets = mockEquipmentSets.filter(item => item.id !== id);
            return true;
        },
    },
    equipment_set_items: {
        getAll: () => [...mockEquipmentSetItems],
        getBySetId: (setId: string) => filterBy(mockEquipmentSetItems, 'set_id', setId),
        insert: (newData: any) => {
            // Check if item already exists in set, if so, update quantity? Or prevent? For now, allow duplicates.
            const newItem = { ...newData, id: generateId() };
            mockEquipmentSetItems.push(newItem);
            return newItem;
        },
        // update: (id: string, updates: any) => { ... }, // If needed
        delete: (id: string) => {
            mockEquipmentSetItems = mockEquipmentSetItems.filter(item => item.id !== id);
            return true;
        },
        deleteBySetId: (setId: string) => {
             mockEquipmentSetItems = mockEquipmentSetItems.filter(item => item.set_id !== setId);
             return true;
        }
    },
};
