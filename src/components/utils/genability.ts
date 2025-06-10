export async function getGenabilitySavings(monthlyBill: number, systemSize: number, zipCode: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/savings-analysis`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthlyBill,
        systemSize,
        zipCode,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch savings analysis');
  }

  return response.json();
}