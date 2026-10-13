import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import {
  CustomerFields,
  customerPayload,
  customerToForm,
  emptyCustomer,
  validateCustomer,
  type CustomerErrors,
  type CustomerForm,
} from '@/components/party-forms';
import { Banner, FormFooter, LoadingState, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useCompany } from '@/context/auth';
import { customerApi, errorMessage, fieldErrorsFrom } from '@/services/api';

export default function CustomerFormScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid?: string }>();
  const { token, companyId } = useCompany();
  const editing = Boolean(uid);
  const [form, setForm] = useState<CustomerForm>(emptyCustomer);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid || !token || !companyId) return;
    customerApi
      .get(token, companyId, uid)
      .then((customer) => setForm(customerToForm(customer)))
      .catch((issue) => setError(errorMessage(issue, 'Could not load customer.')))
      .finally(() => setLoading(false));
  }, [companyId, token, uid]);

  const update = (key: keyof CustomerForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function save() {
    if (!token || !companyId) return;
    const nextErrors = validateCustomer(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setError(null);
    try {
      if (uid) await customerApi.update(token, companyId, uid, customerPayload(form));
      else await customerApi.create(token, companyId, customerPayload(form));
      router.back();
    } catch (issue) {
      setErrors(fieldErrorsFrom(issue));
      setError(errorMessage(issue, 'Could not save customer. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SubScreen
      title={editing ? 'Edit customer' : 'Add customer'}
      footer={
        <FormFooter>
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
          <PrimaryButton label={editing ? 'Update' : 'Create'} icon="checkmark" loading={saving} disabled={loading} onPress={save} />
        </FormFooter>
      }>
      {loading ? (
        <LoadingState label="Loading customer..." />
      ) : (
        <View className="gap-3">
          <Banner tone="error" message={error} />
          <CustomerFields form={form} errors={errors} onChange={update} />
        </View>
      )}
    </SubScreen>
  );
}
