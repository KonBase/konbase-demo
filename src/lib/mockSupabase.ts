import { mockDb } from './mockData';
import { UserRoleType } from '@/types/user';

// --- Mock Auth State ---
let mockSession: any = null; // Store the current mock session

// --- Mock Query Builder ---
// This simulates the chainable query builder (.select, .insert, .update, .delete, .eq, .or, .in, .limit, .order, .single)
class MockQueryBuilder {
    private tableName: keyof typeof mockDb;
    private operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
    private filters: { column: string; value: any }[] = [];
    private orFilter: string | null = null;
    private inFilter: { column: string; values: any[] } | null = null;
    private selectColumns: string = '*';
    private insertData: any = null;
    private updateData: any = null;
    private limitCount: number | null = null;
    private orderColumn: string | null = null;
    private orderAscending: boolean = true;
    private isSingle: boolean = false;
    private rpcName: string | null = null;
    private rpcParams: any = null;

    constructor(tableName: keyof typeof mockDb | null, operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc') {
        this.tableName = tableName as keyof typeof mockDb; // Assume valid table for simplicity now
        this.operation = operation;
    }

    select(columns: string = '*') {
        this.selectColumns = columns;
        return this;
    }

    insert(data: any) {
        this.insertData = data;
        return this;
    }

    update(data: any) {
        this.updateData = data;
        return this;
    }

    delete() {
        // No data needed for delete operation itself
        return this;
    }

    upsert(data: any, options?: { onConflict: string }) {
        // Simple upsert mock: try update, if not found, insert
        // This requires knowing the conflict target (usually 'id')
        const conflictColumn = options?.onConflict || 'id';
        const tableOps = mockDb[this.tableName];
        const existing = tableOps && 'getAll' in tableOps && typeof tableOps.getAll === 'function'
            ? tableOps.getAll().find((item: any) => item[conflictColumn] === data[conflictColumn])
            : null; // Assume not existing if getAll is not available

        if (existing) {
            this.operation = 'update';
            this.updateData = data;
            this.filters.push({ column: conflictColumn, value: data[conflictColumn] });
        } else {
            this.operation = 'insert';
            this.insertData = data;
        }
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push({ column, value });
        return this;
    }

     or(filterString: string) {
        this.orFilter = filterString;
        return this;
    }

     in(column: string, values: any[]) {
        this.inFilter = { column, values };
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
        this.orderColumn = column;
        this.orderAscending = ascending;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    // Mock for RPC calls
    rpc(name: string, params: any) {
        this.operation = 'rpc';
        this.rpcName = name;
        this.rpcParams = params;
        return this;
    }

    // Simulate the final execution (.then or await)
    async then(resolve: (value: { data: any; error: any; count?: number }) => void, reject: (reason?: any) => void) {
        try {
            await new Promise(res => setTimeout(res, 50)); // Simulate network delay

            let resultData: any = null;
            let resultError: any = null;
            let count: number | null = null;

            if (this.operation === 'rpc') {
                // Handle Mock RPC calls
                if (this.rpcName === 'execute_sql') {
                    console.log(`Mock execute_sql: ${this.rpcParams?.sql_query?.substring(0, 100)}...`);
                    // Assume success for demo, no data returned
                    resultData = null;
                } else {
                     console.warn(`Unhandled mock RPC call: ${this.rpcName}`);
                     resultData = null; // Or mock specific RPC results if needed
                }

            } else if (this.tableName && mockDb[this.tableName]) {
                const tableOps = mockDb[this.tableName] as any; // Type assertion for simplicity

                switch (this.operation) {
                    case 'select':
                        let data = tableOps.getAll ? tableOps.getAll() : [];

                        // Apply filters
                        if (this.filters.length > 0) {
                            data = tableOps.filter ? tableOps.filter(this.filters) : applyFilters(data, this.filters);
                        }
                        if (this.orFilter && tableOps.filterOr) {
                             data = tableOps.filterOr(this.orFilter, this.limitCount); // Pass limit here for OR
                        }
                         if (this.inFilter && tableOps.filterIn) {
                             data = tableOps.filterIn(this.inFilter.column, this.inFilter.values);
                         }


                        // Apply ordering
                        if (this.orderColumn) {
                            data.sort((a: any, b: any) => {
                                const valA = a[this.orderColumn!];
                                const valB = b[this.orderColumn!];
                                if (valA < valB) return this.orderAscending ? -1 : 1;
                                if (valA > valB) return this.orderAscending ? 1 : -1;
                                return 0;
                            });
                        }

                        // Apply limit (unless already applied by OR filter)
                        if (this.limitCount !== null && !this.orFilter) {
                            data = data.slice(0, this.limitCount);
                        }

                        count = data.length; // Get count after filtering

                        // Handle .single()
                        if (this.isSingle) {
                            resultData = data.length > 0 ? data[0] : null;
                            if (data.length > 1) {
                                console.warn(`Mock '.single()' called but multiple rows matched query on ${this.tableName}`);
                            }
                        } else {
                            resultData = data;
                        }
                        break;

                    case 'insert':
                        try {
                            resultData = tableOps.insert ? tableOps.insert(this.insertData) : null;
                            if (this.isSingle && Array.isArray(resultData)) {
                                resultData = resultData[0]; // Supabase returns array even for single insert sometimes
                            }
                        } catch (e: any) {
                            resultError = { message: e.message || 'Mock insert failed' };
                        }
                        break;

                    case 'update':
                         try {
                            const filterColumn = this.filters[0]?.column || 'id'; // Assume ID if not specified
                            const filterValue = this.filters[0]?.value;
                            if (!filterValue) throw new Error("Update requires a filter (e.g., .eq())");

                            // Find all matching items
                            const itemsToUpdate = tableOps.getAll().filter((item: any) => item[filterColumn] === filterValue);

                            if (itemsToUpdate.length === 0) {
                                // Supabase update doesn't error if no rows match, just returns empty data
                                resultData = [];
                            } else {
                                const updatedItems = itemsToUpdate.map((item: any) => tableOps.update(item.id, this.updateData));
                                resultData = this.isSingle ? (updatedItems[0] || null) : updatedItems;
                            }
                        } catch (e: any) {
                            resultError = { message: e.message || 'Mock update failed' };
                        }
                        break;

                    case 'delete':
                        try {
                            const filterColumn = this.filters[0]?.column || 'id';
                            const filterValue = this.filters[0]?.value;
                            if (!filterValue) throw new Error("Delete requires a filter (e.g., .eq())");

                            // Find all matching items before deleting
                             const itemsToDelete = tableOps.getAll().filter((item: any) => item[filterColumn] === filterValue);
                             resultData = itemsToDelete; // Supabase delete returns the deleted items

                             // Perform deletion
                             itemsToDelete.forEach((item: any) => tableOps.delete(item.id));

                        } catch (e: any) {
                            resultError = { message: e.message || 'Mock delete failed' };
                        }
                        break;
                }
            } else { // If not RPC and table was not found or not specified
                 resultError = { message: `Mock table '${this.tableName}' not found` };
            }


            resolve({ data: resultData, error: resultError, count });
        } catch (error) {
            console.error("Error in mock query execution:", error);
            reject(error);
        }
    }
}


// --- Mock Supabase Client Object ---
export const mockSupabase = {
    auth: {
        // Mock user credentials
        users: {
            'admin@konbase.cfd': { id: 'user-admin', password: 'password123', role: 'system_admin' as UserRoleType, email: 'admin@konbase.cfd' },
            'manager@konbase.cfd': { id: 'user-manager', password: 'password123', role: 'manager' as UserRoleType, email: 'manager@konbase.cfd' },
            'member@konbase.cfd': { id: 'user-member', password: 'password123', role: 'member' as UserRoleType, email: 'member@konbase.cfd' },
        },

        signInWithPassword: async (credentials: { email?: string; password?: string }) => {
            await new Promise(res => setTimeout(res, 100)); // Simulate delay
            const email = credentials.email?.toLowerCase();
            const user = email ? mockSupabase.auth.users[email as keyof typeof mockSupabase.auth.users] : null;

            if (user && user.password === credentials.password) {
                // --- Removed email verification check for demo ---
                // In a real scenario, you might check a flag like user.email_confirmed_at
                // if (!user.email_confirmed_at) {
                //     return { data: { session: null }, error: { message: 'Please verify your email before logging in.', status: 401 } };
                // }
                // --- End of removed check ---

                const profile = mockDb.profiles.getById(user.id);
                mockSession = {
                    user: {
                        id: user.id,
                        email: user.email,
                        app_metadata: { provider: 'email' },
                        user_metadata: { name: profile?.name || user.email },
                        aud: 'authenticated',
                        created_at: profile?.created_at || new Date().toISOString(),
                        email_confirmed_at: profile?.email_confirmed_at || new Date().toISOString(),
                        // Add other user fields if needed by the app
                    },
                    access_token: `mock-access-token-${user.id}`,
                    refresh_token: `mock-refresh-token-${user.id}`,
                    expires_in: 3600,
                    token_type: 'bearer',
                };
                 mockDb.audit_logs.insert({ action: 'login', entity: 'auth', entity_id: user.id, user_id: user.id, changes: { method: 'password' } });
                return { data: { session: mockSession }, error: null };
            } else {
                return { data: { session: null }, error: { message: 'Invalid login credentials', status: 400 } };
            }
        },

        signUp: async (credentials: { email?: string; password?: string; options?: any }) => {
             await new Promise(res => setTimeout(res, 100));
             const email = credentials.email?.toLowerCase();
             if (!email || !credentials.password) {
                 return { data: { user: null, session: null }, error: { message: 'Email and password are required', status: 400 } };
             }
             if (mockSupabase.auth.users[email as keyof typeof mockSupabase.auth.users]) {
                 return { data: { user: null, session: null }, error: { message: 'User already registered', status: 400 } };
             }

             // Add new user (simplified - no email verification in demo)
             const newUserId = `user-${generateId()}`;
             const newUser = { id: newUserId, password: credentials.password, role: 'member' as UserRoleType, email: email };
             (mockSupabase.auth.users as any)[email] = newUser;

             // Create profile
             const name = credentials.options?.data?.name || email.split('@')[0];
             const profileData = { id: newUserId, name: name, email: email, role: 'member' as UserRoleType, association_id: 'assoc-1' }; // Assign to demo assoc
             mockDb.profiles.insert(profileData);

             console.log("Mock User Signed Up:", newUser);
             mockDb.audit_logs.insert({ action: 'signup', entity: 'auth', entity_id: newUserId, user_id: newUserId, changes: { email: email } });

             // Log them in immediately for demo
             return mockSupabase.auth.signInWithPassword({ email, password: credentials.password });
        },

        signOut: async () => {
            await new Promise(res => setTimeout(res, 50));
            const userId = mockSession?.user?.id;
            if (userId) {
                 mockDb.audit_logs.insert({ action: 'logout', entity: 'auth', entity_id: userId, user_id: userId });
            }
            mockSession = null;
            // Trigger auth state change listeners if the app uses them
            mockSupabase.auth.onAuthStateChangeCallback?.( 'SIGNED_OUT', null);
            return { error: null };
        },

        getSession: async () => {
            await new Promise(res => setTimeout(res, 10)); // Very quick check
            return { data: { session: mockSession }, error: null };
        },

        getUser: async () => {
            await new Promise(res => setTimeout(res, 10));
            // Ensure getUser also returns the confirmed status if a session exists
            const user = mockSession?.user || null;
            if (user && !user.email_confirmed_at) {
                 const profile = mockDb.profiles.getById(user.id);
                 user.email_confirmed_at = profile?.email_confirmed_at || new Date().toISOString();
            }
            return { data: { user: user }, error: null };
        },

        updateUser: async (credentials: { password?: string; data?: any }) => {
             await new Promise(res => setTimeout(res, 100));
             if (!mockSession?.user) {
                 return { data: { user: null }, error: { message: 'Not authenticated', status: 401 } };
             }
             const userId = mockSession.user.id;
             const userEmail = mockSession.user.email;

             // Update password in mock store
             if (credentials.password && userEmail && mockSupabase.auth.users[userEmail as keyof typeof mockSupabase.auth.users]) {
                 mockSupabase.auth.users[userEmail as keyof typeof mockSupabase.auth.users].password = credentials.password;
                 console.log(`Mock password updated for ${userEmail}`);
                 mockDb.audit_logs.insert({ action: 'update_user', entity: 'auth', entity_id: userId, user_id: userId, changes: { password_changed: true } });
             }
             // Update profile data
             if (credentials.data) {
                 mockDb.profiles.update(userId, credentials.data);
                 mockSession.user.user_metadata = { ...mockSession.user.user_metadata, ...credentials.data };
                 mockDb.audit_logs.insert({ action: 'update_user', entity: 'profile', entity_id: userId, user_id: userId, changes: credentials.data });
             }

             return { data: { user: mockSession.user }, error: null };
        },

        setSession: async (sessionData: { access_token: string; refresh_token: string }) => {
            // Used for OAuth or password recovery redirects - simulate success
             await new Promise(res => setTimeout(res, 50));
             console.log("Mock setSession called", sessionData);
             // In a real mock, you might decode the mock token to find the user
             // For simplicity, assume it logs in the admin user if no session exists
             if (!mockSession) {
                 const adminEmail = 'admin@konbase.cfd';
                 const adminUser = mockSupabase.auth.users[adminEmail];
                 const profile = mockDb.profiles.getById(adminUser.id);
                 mockSession = {
                     user: { id: adminUser.id, email: adminUser.email, user_metadata: { name: profile?.name } /* ... */ },
                     access_token: sessionData.access_token,
                     refresh_token: sessionData.refresh_token,
                     /* ... */
                 };
                 mockSupabase.auth.onAuthStateChangeCallback?.('SIGNED_IN', mockSession);
             }
             return { data: { session: mockSession, user: mockSession?.user }, error: null };
        },

        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            // Store the callback to notify on signIn/signOut
            mockSupabase.auth.onAuthStateChangeCallback = callback;
            // Immediately call with current state
            callback(mockSession ? 'INITIAL_SESSION' : 'SIGNED_OUT', mockSession);

            return {
                data: { subscription: { unsubscribe: () => { mockSupabase.auth.onAuthStateChangeCallback = null; } } },
            };
        },
        // Add other auth methods as needed (e.g., resetPasswordForEmail, verifyOtp)
        resetPasswordForEmail: async (email: string, options?: any) => {
            await new Promise(res => setTimeout(res, 100));
            console.log(`Mock password reset email sent to ${email}. Redirect URL: ${options?.redirectTo}`);
            // In demo, maybe log a link that simulates the reset flow
            const mockResetToken = `mock-reset-${generateId()}`;
            console.log(`Simulated reset link: ${options?.redirectTo}?token=${mockResetToken}#type=recovery`);
            return { data: {}, error: null };
        },
         verifyOtp: async (options: { email?: string, token?: string, type: string }) => {
             await new Promise(res => setTimeout(res, 100));
             console.log("Mock verifyOtp called:", options);
             // Simulate successful verification for demo
             if (options.token && options.type === 'recovery') {
                 // Simulate logging in the user associated with the token (if possible to determine)
                 // For simplicity, just return a mock session for admin
                 const adminEmail = 'admin@konbase.cfd';
                 const adminUser = mockSupabase.auth.users[adminEmail];
                 const profile = mockDb.profiles.getById(adminUser.id);
                 mockSession = {
                     user: { id: adminUser.id, email: adminUser.email, user_metadata: { name: profile?.name } /* ... */ },
                     access_token: `mock-access-token-${adminUser.id}`,
                     refresh_token: `mock-refresh-token-${adminUser.id}`,
                     /* ... */
                 };
                 mockSupabase.auth.onAuthStateChangeCallback?.('SIGNED_IN', mockSession);
                 return { data: { session: mockSession, user: mockSession?.user }, error: null };
             }
             return { data: {}, error: { message: 'Invalid OTP', status: 400 } };
         },

        // Placeholder for the callback storage
        onAuthStateChangeCallback: null as ((event: string, session: any) => void) | null,
    },

    // --- Mock Database Operations ---
    from: (tableName: keyof typeof mockDb) => {
        // Return a new query builder instance for the specified table
        return new MockQueryBuilder(tableName, 'select'); // Default to select
    },

    // --- Mock Storage Operations ---
    storage: {
        from: (bucketName: string) => ({
            upload: async (path: string, file: File) => {
                await new Promise(res => setTimeout(res, 200)); // Simulate upload delay
                console.log(`Mock upload to ${bucketName}/${path}: ${file.name} (${file.size} bytes)`);
                 // In demo, maybe add to a mock document list if it's the documents bucket
                 if (bucketName === 'documents') {
                     // Extract item ID if possible from path (depends on structure)
                     const parts = path.split('/');
                     const itemId = parts.length > 1 ? parts[1] : 'unknown-item';
                     const uploaded_by = mockSession?.user?.id || 'unknown-user';
                     mockDb.documents.insert({
                         name: file.name,
                         file_type: file.type,
                         file_url: `/mock-docs/${path}`, // Mock URL
                         item_id: itemId,
                         uploaded_by: uploaded_by,
                     });
                 }
                return { data: { path }, error: null };
            },
            download: async (path: string) => {
                await new Promise(res => setTimeout(res, 50));
                console.log(`Mock download request for ${bucketName}/${path}`);
                // Return a mock blob or error
                return { data: null, error: { message: 'Mock download not implemented', status: 501 } };
                // Or: return { data: new Blob(["mock file content"]), error: null };
            },
            getPublicUrl: (path: string) => {
                 console.log(`Mock getPublicUrl for ${bucketName}/${path}`);
                 // Return a predictable mock URL structure
                 const mockBaseUrl = '/mock-storage'; // Use relative path for GH pages
                 return { data: { publicUrl: `${mockBaseUrl}/${bucketName}/${path}` }, error: null };
            },
            remove: async (paths: string[]) => {
                await new Promise(res => setTimeout(res, 100));
                console.log(`Mock remove from ${bucketName}:`, paths);
                 // In demo, remove from mock document list if applicable
                 if (bucketName === 'documents' && mockDb.documents) {
                     paths.forEach(path => {
                         const urlToRemove = `/mock-docs/${path}`; // Match URL used in insert
                         // Find the document by URL and delete it by ID
                         const allDocs = mockDb.documents.getAll ? mockDb.documents.getAll() : [];
                         const docToRemove = allDocs.find((doc: any) => doc.file_url === urlToRemove);
                         if (docToRemove && mockDb.documents.delete) {
                             mockDb.documents.delete(docToRemove.id);
                         } else {
                             console.warn(`Mock document with URL ${urlToRemove} not found or delete method missing.`);
                         }
                     });
                 }
                return { data: paths.map(path => ({ name: path.split('/').pop() })), error: null };
            },
            // Add other storage methods like list, move, copy as needed
        }),
    },

    // --- Mock Edge Functions ---
    functions: {
        invoke: async (functionName: string, options?: { body?: any; headers?: any }) => {
            await new Promise(res => setTimeout(res, 150)); // Simulate function execution delay
            console.log(`Mock invoke function: ${functionName}`, options);

            // --- Mock Specific Functions ---
            if (functionName === 'elevate-to-super-admin') {
                const securityCode = options?.body?.securityCode;
                const MOCK_ELEVATION_SECRET = 'DEMO_SECRET'; // Use a fixed secret for demo
                const userId = mockSession?.user?.id;
                const profile = userId ? mockDb.profiles.getById(userId) : null;

                if (!profile) return { data: null, error: { message: 'Not authenticated' } };
                if (profile.role !== 'system_admin') return { data: null, error: { message: 'Only system administrators can be elevated' } };
                if (securityCode !== MOCK_ELEVATION_SECRET) return { data: null, error: { message: 'Invalid security code' } };

                // Elevate mock user
                mockDb.profiles.update(userId, { role: 'super_admin' });
                 mockDb.audit_logs.insert({ action: 'elevate_to_super_admin', entity: 'profiles', entity_id: userId, user_id: userId, changes: { new_role: 'super_admin' } });
                return { data: { success: true, message: 'Successfully elevated to super admin' }, error: null };
            }

            if (functionName === 'generate-totp-secret') {
                const mockSecret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Example Base32 secret
                const mockUri = `otpauth://totp/KonBase:Demo?secret=${mockSecret}&issuer=KonBase`;
                console.log("Mock generate-totp-secret returning:", { secret: mockSecret, keyUri: mockUri });
                return { data: { secret: mockSecret, keyUri: mockUri }, error: null };
            }

            if (functionName === 'verify-totp') {
                const token = options?.body?.token?.trim().replace(/\s/g, '');
                console.log("Mock verify-totp received token:", token);
                // Simple mock: accept specific tokens for demo
                if (token === '123456' || token === '000000') {
                    console.log("Mock verify-totp: Token accepted.");
                    return { data: { verified: true, delta: 0 }, error: null };
                }
                console.log("Mock verify-totp: Token rejected.");
                return { data: { verified: false, delta: null }, error: null };
            }

             if (functionName === 'generate-recovery-keys') {
                 const keys = Array.from({ length: 10 }, () => generateId().substring(0, 12));
                 console.log("Mock generate-recovery-keys returning:", keys);
                 return { data: { keys }, error: null };
             }

             if (functionName === 'complete-2fa-setup') {
                 const userId = mockSession?.user?.id;
                 console.log("Mock complete-2fa-setup called for user:", userId, "with data:", options?.body);
                 if (!userId) {
                     console.error("Mock complete-2fa-setup: No authenticated user.");
                     return { data: null, error: { message: 'Not authenticated' } };
                 }
                 // Update profile in mockDb
                 mockDb.profiles.update(userId, { two_factor_enabled: true });
                 // Store mock 2FA data (e.g., secret reference, recovery keys hash - simplified here)
                 mockDb.user_2fa.insert({ user_id: userId, ...options?.body });
                 mockDb.audit_logs.insert({ action: 'enable_2fa', entity: 'profile', entity_id: userId, user_id: userId });
                 console.log("Mock complete-2fa-setup: Profile updated and 2FA data stored for user:", userId);
                 return { data: { success: true, message: '2FA has been successfully enabled' }, error: null };
             }

             if (functionName === 'disable-2fa') {
                 const userId = mockSession?.user?.id;
                 console.log("Mock disable-2fa called for user:", userId);
                 if (!userId) {
                    console.error("Mock disable-2fa: No authenticated user.");
                    return { data: null, error: { message: 'Not authenticated' } };
                 }
                 // Update profile in mockDb
                 mockDb.profiles.update(userId, { two_factor_enabled: false });
                 // Remove mock 2FA data
                 mockDb.user_2fa.delete(userId);
                 mockDb.audit_logs.insert({ action: 'disable_2fa', entity: 'profile', entity_id: userId, user_id: userId });
                 console.log("Mock disable-2fa: Profile updated and 2FA data removed for user:", userId);
                 return { data: { success: true, message: '2FA has been successfully disabled' }, error: null };
             }


            // Default mock response for unhandled functions
            return { data: { message: `Mock response from ${functionName}` }, error: null };
        }
    },

     // --- Mock Realtime ---
     // Realtime is complex to mock fully. Provide basic stubs.
     channel: (channelName: string) => {
         console.log(`Mock channel created: ${channelName}`);
         let onCallbacks: { event: string, filter: any, callback: any }[] = []; // Store multiple callbacks
         let subscribeCallback: any = null;
         const channelInstance = { // Create an object to return for chaining
             on: (event: string, filter: any, callback: any) => {
                 console.log(`Mock listener added for event '${event}' on channel '${channelName}'`, filter);
                 onCallbacks.push({ event, filter, callback }); // Store callback
                 return channelInstance; // Return the channel object itself for chaining
             },
             subscribe: (callbackSub: any) => {
                 console.log(`Mock subscribed to channel '${channelName}'`);
                 subscribeCallback = callbackSub;
                 // Simulate immediate subscription success
                 setTimeout(() => subscribeCallback?.('SUBSCRIBED'), 10);
                 return { // Return an object with an unsubscribe method
                     unsubscribe: () => {
                         console.log(`Mock unsubscribed from channel '${channelName}'`);
                         onCallbacks = []; // Clear callbacks on unsubscribe
                         subscribeCallback = null;
                     }
                 };
             },
             // Mock sending a message (for testing listeners)
             mockReceive: (event: string, payload: any) => {
                 console.log(`Mock receiving event '${event}' on channel '${channelName}'`, payload);
                 // Find matching callbacks
                 const matchingCallbacks = onCallbacks.filter(cb => {
                     // Basic event matching. Filter matching would be more complex.
                     return cb.event === '*' || cb.event === event;
                 });

                 matchingCallbacks.forEach(cbInfo => {
                     cbInfo.callback({
                         event: event, // 'INSERT', 'UPDATE', 'DELETE'
                         schema: 'public',
                         table: channelName.split(':')[1], // Guess table from channel name
                         commit_timestamp: new Date().toISOString(),
                         new: event !== 'DELETE' ? payload : undefined,
                         old: event !== 'INSERT' ? payload : undefined, // Simplified old payload
                     });
                 });
             }
         };
         return channelInstance; // Return the created channel object
     },
     getChannels: () => {
         console.log("Mock getChannels called");
         return []; // Return empty array
     },
     removeChannel: (channel: any) => {
         console.log("Mock removeChannel called", channel);
         return Promise.resolve('ok');
     },
     removeAllChannels: () => {
         console.log("Mock removeAllChannels called");
         return Promise.resolve('ok');
     },

    // --- Mock RPC ---
    // The .rpc() method is handled within the MockQueryBuilder
    rpc: (name: string, params: any) => {
        return new MockQueryBuilder(null, 'rpc').rpc(name, params);
    }
};

/**
 * Generic filter function used as a fallback if a specific table
 * in mockDb doesn't provide its own .filter() method.
 * Applies AND logic for all provided filters.
 */
function applyFilters(data: any[], filters: { column: string; value: any; }[]): any[] {
    if (!filters || filters.length === 0) {
        return data; // Return original data if no filters are provided
    }

    return data.filter(item => {
        // Check if the item satisfies ALL filter conditions
        return filters.every(filter => {
            // Check if the item has the specified column and its value matches the filter value.
            // This assumes simple equality checks. More complex operators (like >, <, etc.)
            // would require extending the filter object structure and this logic.
            return item.hasOwnProperty(filter.column) && item[filter.column] === filter.value;
        });
    });
}
/**
 * Generates a simple pseudo-random string ID for mocking purposes.
 * Not guaranteed to be unique, but sufficient for demo data.
 */
function generateId(): string {
    // Combine timestamp and random number for better pseudo-uniqueness
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

