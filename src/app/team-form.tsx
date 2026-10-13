import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { Banner, EmptyState, Field, FormFooter, PrimaryButton, Section, SecondaryButton, SelectField } from '@/components/ui';
import { roleLabels, useCompany } from '@/context/auth';
import { EMAIL_PATTERN, PHONE_PATTERN } from '@/lib/format';
import { errorMessage, fieldErrorsFrom, teamApi, type CompanyMemberPayload } from '@/services/api';

type AssignableRole = CompanyMemberPayload['role'];

const roleOptions: { value: AssignableRole; label: string; description: string }[] = [
  { value: 'admin', label: roleLabels.admin, description: 'Manages bookings, customers and team members.' },
  { value: 'dispatcher', label: roleLabels.dispatcher, description: 'Creates and updates bookings and customers.' },
  { value: 'viewer', label: roleLabels.viewer, description: 'Can view company data without making changes.' },
];

type FormState = { name: string; email: string; mobile: string; role: AssignableRole };

export default function TeamFormScreen() {
  const router = useRouter();
  const { token, isOwner, ownedCompanyId } = useCompany();
  const [form, setForm] = useState<FormState>({ name: '', email: '', mobile: '', role: 'dispatcher' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function save() {
    if (!token || !ownedCompanyId) return;
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.mobile.trim() && !PHONE_PATTERN.test(form.mobile.trim())) next.mobile = 'Enter a valid mobile number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError(null);
    try {
      await teamApi.create(token, ownedCompanyId, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim() || null,
        role: form.role,
      });
      router.back();
    } catch (issue) {
      setErrors(fieldErrorsFrom(issue));
      setError(errorMessage(issue, 'Could not add member. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  if (!isOwner) {
    return (
      <SubScreen title="Add member">
        <EmptyState icon="shield-lock-outline" title="Only the company owner can manage teams" description="Ask your company owner to add or update team members." />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Add member"
      footer={
        <FormFooter>
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
          <PrimaryButton label="Add member" icon="person-add-outline" loading={saving} onPress={save} />
        </FormFooter>
      }>
      <View className="gap-3">
        <Banner tone="error" message={error} />
        <Section icon="account-plus-outline" title="Member details">
          <Field label="Full name" required value={form.name} onChangeText={(value) => update('name', value)} placeholder="Enter full name" error={errors.name} maxLength={255} />
          <View className="mt-3">
            <Field
              label="Email"
              required
              value={form.email}
              onChangeText={(value) => update('email', value)}
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              helper="They sign in with a one-time code sent to this email."
              maxLength={255}
            />
          </View>
          <View className="mt-3">
            <Field label="Mobile" value={form.mobile} onChangeText={(value) => update('mobile', value)} placeholder="9876543210" keyboardType="phone-pad" error={errors.mobile} maxLength={30} />
          </View>
          <View className="mt-3 flex-row">
            <SelectField
              label="Role"
              required
              value={form.role}
              options={roleOptions}
              onChange={(value) => update('role', value)}
              error={errors.role}
              helper={roleOptions.find((option) => option.value === form.role)?.description}
            />
          </View>
        </Section>
      </View>
    </SubScreen>
  );
}
