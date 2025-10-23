import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';
import { Mail, Phone, Send, User, MessageSquare } from 'lucide-react';

export const NotificationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      toast({
        title: "❌ Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Notifications Sent Successfully!",
          description: `Email: ${data.results.email.sent ? '✅' : '❌'} | WhatsApp: ${data.results.whatsapp.sent ? '✅' : '❌'}`,
        });
        // Clear form
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast({
          title: "⚠️ Partial Success",
          description: `Email: ${data.results.email.sent ? '✅ Sent' : '❌ Failed'} | WhatsApp: ${data.results.whatsapp.sent ? '✅ Sent' : '❌ Failed'}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Connection Error",
        description: error.message || "Failed to send notification. Please check if the server is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Send className="w-6 h-6" />
          Send Notification
        </CardTitle>
        <CardDescription className="text-blue-100">
          Send Email & WhatsApp notifications instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Recipient Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="9876543210"
              maxLength={10}
              required
            />
            <p className="text-xs text-gray-500">Enter 10-digit mobile number without country code</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Subject
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Notification subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your message here..."
              rows={5}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ How it works:</strong> This form will send notifications via both Email and WhatsApp simultaneously. 
            Make sure the recipient has joined the Twilio WhatsApp sandbox for WhatsApp delivery.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationForm;
