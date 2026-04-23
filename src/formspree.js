export async function submitFormspreeContact(email, name, message) {
  const formId = 'mjgjpnbb'; // Your Formspree ID
  
  try {
    const response = await fetch(`https://formspree.io/f/${formId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        message,
        _subject: `New Contact from ${name}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit form');
    }

    return { success: true };
  } catch (error) {
    console.error('Formspree error:', error);
    return { success: false, error };
  }
}
