import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Headphones, Mail, MessageSquare, Send, Book, HelpCircle, CheckCircle } from "lucide-react";

export default function Support() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;

    // In a real app, this would send to a support ticketing system
    // For now, we'll just simulate success
    setSubmitted(true);
    setTimeout(() => {
      setForm({ subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const faqs = [
    {
      question: "How do I add new menu items?",
      answer: "Go to Menu Management, click 'Add Item', fill in the details including name, price, category, and save."
    },
    {
      question: "How do I process a refund?",
      answer: "Navigate to Orders, find the order, and use the refund option in the order details."
    },
    {
      question: "Can I manage multiple outlets?",
      answer: "Yes! The system supports multiple outlets. Add them in Admin Panel > Outlets section."
    },
    {
      question: "How do I track inventory?",
      answer: "Go to Inventory section to add ingredients, set min/max stock levels, and monitor usage."
    },
    {
      question: "How do I generate reports?",
      answer: "Visit the Reports page, select your date range, and export data in CSV format."
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Headphones className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Center</h1>
          <p className="text-slate-600">We're here to help you succeed</p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Email Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Get help via email</p>
            <a href="mailto:support@restaurantos.com" className="text-sm font-medium text-orange-600 hover:text-orange-700">
              support@restaurantos.com
            </a>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Chat with support team</p>
            <Badge className="bg-green-100 text-green-700 border-0">Available 9 AM - 6 PM</Badge>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Browse help articles</p>
            <Button variant="outline" size="sm" className="w-full">
              View Docs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-600" />
            Send us a message
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
              <p className="text-slate-600">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={user?.full_name || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Your Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  placeholder="What do you need help with?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({...form, message: e.target.value})}
                  placeholder="Describe your issue or question..."
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-600">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
              <p className="text-sm text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}