import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const EmailTester = () => {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: '',
    text: ''
  });

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const handleVerifyConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/email/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Email connection verified! ✅');
      } else {
        toast.error('Failed to verify email connection ❌');
      }
    } catch (error) {
      toast.error('Error verifying connection');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ to: testEmail })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Test email sent to ${testEmail}! 📧`);
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error) {
      toast.error('Error sending test email');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject || !customEmail.text) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(customEmail)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Email sent to ${customEmail.to}! 📧`);
        setCustomEmail({ to: '', subject: '', text: '' });
      } else {
        toast.error('Failed to send email');
      }
    } catch (error) {
      toast.error('Error sending email');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Email System Tester</h1>

      {/* Verify Connection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Verify Email Connection</CardTitle>
          <CardDescription>
            Test if the email server connection is working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleVerifyConnection} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Verifying...' : 'Verify Connection'}
          </Button>
        </CardContent>
      </Card>

      {/* Send Test Email */}
      <Card>
        <CardHeader>
          <CardTitle>2. Send Test Email</CardTitle>
          <CardDescription>
            Send a pre-formatted test email to any address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSendTestEmail} 
            disabled={loading || !testEmail}
            className="w-full md:w-auto"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Send Custom Email */}
      <Card>
        <CardHeader>
          <CardTitle>3. Send Custom Email</CardTitle>
          <CardDescription>
            Send a custom email with your own content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-to">Recipient Email</Label>
            <Input
              id="custom-to"
              type="email"
              placeholder="recipient@example.com"
              value={customEmail.to}
              onChange={(e) => setCustomEmail({ ...customEmail, to: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-subject">Subject</Label>
            <Input
              id="custom-subject"
              type="text"
              placeholder="Email subject"
              value={customEmail.subject}
              onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-text">Message</Label>
            <Textarea
              id="custom-text"
              placeholder="Your email message here..."
              rows={5}
              value={customEmail.text}
              onChange={(e) => setCustomEmail({ ...customEmail, text: e.target.value })}
            />
          </div>
          <Button 
            onClick={handleSendCustomEmail} 
            disabled={loading || !customEmail.to || !customEmail.subject || !customEmail.text}
            className="w-full md:w-auto"
          >
            {loading ? 'Sending...' : 'Send Custom Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>📌 Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>You must be signed in to use these features</li>
            <li>Email is configured with Gmail SMTP (smtp.gmail.com)</li>
            <li>Using sender: sabareeshwarans3@gmail.com</li>
            <li>Check your spam folder if you don't see the email</li>
            <li>See EMAIL-API-GUIDE.md for detailed API documentation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTester;
