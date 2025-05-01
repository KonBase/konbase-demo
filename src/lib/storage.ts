import { supabase } from '@/lib/supabase'; // Imports the mock client now
import { logDebug } from '@/utils/debug';

// Create storage bucket if it doesn't exist - NO-OP in Demo Mode
export async function initializeStorage() {
  logDebug('initializeStorage called in Demo Mode - skipping', null, 'info');
  return;
  /* // Original code:
  try {
    // Check if bucket exists first to avoid unnecessary errors/creations
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      logDebug('Error listing buckets during initialization', listError, 'warn');
      // Don't throw here, maybe just limited permissions
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'documents');

    if (!bucketExists) {
      logDebug('Documents bucket not found, attempting to create...', null, 'info');
      const { error } = await supabase.storage.createBucket('documents', {
        public: true, // Set to true for easier access, adjust RLS later if needed
      });
      if (error) {
        logDebug('Failed to create documents bucket', error, 'error');
        // Attempt to add policy even if creation failed (might exist but wasn't listed)
        await addPublicBucketPolicy();
        throw error; // Re-throw after attempting policy fix
      } else {
        logDebug('Documents bucket created successfully', null, 'info');
        await addPublicBucketPolicy(); // Add policy after successful creation
      }
    } else {
      logDebug('Documents bucket already exists.', null, 'info');
      // Verify access / policy even if it exists
      await verifyBucketAccess('documents');
      await addPublicBucketPolicy(); // Ensure policy exists
    }
  } catch (error) {
    logDebug('Error during storage initialization', error, 'error');
    // Don't prevent app load, but log the error
  }
  */
}

// Verify bucket access without trying to create it if it exists - NO-OP in Demo Mode
async function verifyBucketAccess(bucketName: string) {
   logDebug(`verifyBucketAccess called for ${bucketName} in Demo Mode - skipping`, null, 'info');
   return;
  /* // Original code:
  try {
    // Attempt a simple operation like listing with a limit of 0
    const { error } = await supabase.storage.from(bucketName).list('', { limit: 0 });
    if (error) {
      logDebug(`Error verifying access to bucket ${bucketName}`, error, 'warn');
    } else {
      logDebug(`Successfully verified access to bucket ${bucketName}`, null, 'info');
    }
  } catch (error) {
    logDebug(`Exception verifying access to bucket ${bucketName}`, error, 'warn');
  }
  */
}

// Add a public bucket policy to avoid RLS issues - NO-OP in Demo Mode
async function addPublicBucketPolicy() {
   logDebug('addPublicBucketPolicy called in Demo Mode - skipping', null, 'info');
   return;
  /* // Original code:
  try {
    // This requires specific SQL execution, potentially using the execute_sql RPC or manual setup.
    // For simplicity, we assume public: true during creation is sufficient for now,
    // or that RLS policies will be handled separately if public is false.
    logDebug('Skipping automatic public bucket policy creation. Ensure bucket is public or RLS is configured.', null, 'info');

    // Example SQL (requires admin privileges / execute_sql function):
    // const policySQL = `
    //   CREATE POLICY "Public Access" ON storage.objects
    //   FOR SELECT USING ( bucket_id = 'documents' );
    //
    //   CREATE POLICY "Authenticated Insert" ON storage.objects
    //   FOR INSERT WITH CHECK ( bucket_id = 'documents' AND auth.role() = 'authenticated' );
    // `;
    // const { error } = await supabase.rpc('execute_sql', { sql_query: policySQL });
    // if (error) logDebug('Failed to apply storage policies', error, 'warn');
    // else logDebug('Storage policies applied/verified', null, 'info');

  } catch (error) {
    logDebug('Error applying storage bucket policy', error, 'warn');
  }
  */
}


// Initialize storage when the app starts with error handling - Disabled in Demo Mode
/* // Original code:
try {
  // Delay the initialization slightly to ensure auth is ready
  setTimeout(() => {
    initializeStorage().catch(err => {
      logDebug('Storage initialization had issues - application will continue:', err, 'warn');
    });
  }, 3000); // Increased delay to ensure auth is fully established
} catch (error) {
  logDebug('Error calling initializeStorage - application will continue:', error, 'warn');
}
*/
logDebug('Automatic storage initialization disabled in Demo Mode.', null, 'info');
