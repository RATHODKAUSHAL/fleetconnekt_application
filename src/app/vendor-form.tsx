import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import {
  emptyVendor,
  validateVendor,
  VendorFields,
  vendorPayload,
  vendorToForm,
  type VendorErrors,
  type VendorForm,
} from '@/components/party-forms';
import { Banner, FormFooter, LoadingState, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useCompany } from '@/context/auth';
import { errorMessage, fieldErrorsFrom, vendorApi } from '@/services/api';

export default function VendorFormScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid?: string }>();
  const { token, companyId } = useCompany();
  const editing = Boolean(uid);
  const [form, setForm] = useState<VendorForm>(emptyVendor);
  const [errors, setErrors] = useState<VendorErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid || !token || !companyId) return;
    vendorApi
      .get(token, companyId, uid)
      .then((vendor) => setForm(vendorToForm(vendor)))
      .catch((issue) => setError(errorMessage(issue, 'Could not load vendor.')))
      .finally(() => setLoading(false));
  }, [companyId, token, uid]);

  const update = <Key extends keyof VendorForm>(key: Key, value: VendorForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function save() {
    if (!token || !companyId) return;
    const nextErrors = validateVendor(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setError(null);
    try {
      if (uid) await vendorApi.update(token, companyId, uid, vendorPayload(form));
      else await vendorApi.create(token, companyId, vendorPayload(form));
      router.back();
    } catch (issue) {
      setErrors(fieldErrorsFrom(issue));
      setError(errorMessage(issue, 'Could not save vendor. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SubScreen
      title={editing ? 'Edit vendor' : 'Add vendor'}
      footer={
        <FormFooter>
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
          <PrimaryButton label={editing ? 'Update' : 'Create'} icon="checkmark" loading={saving} disabled={loading} onPress={save} />
        </FormFooter>
      }>
      {loading ? (
        <LoadingState label="Loading vendor..." />
      ) : (
        <View className="gap-3">
          <Banner tone="error" message={error} />
          <VendorFields form={form} errors={errors} onChange={update} />
        </View>
      )}
    </SubScreen>
  );
}
