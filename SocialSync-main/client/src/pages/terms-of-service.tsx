import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Scale, Users, Shield } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/settings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: June 25, 2025
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Welcome to our social media platform. These Terms of Service ("Terms") govern your use of our website, mobile application, and services (collectively, the "Service") operated by our company.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
              </p>
            </CardContent>
          </Card>

          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-5 h-5 mr-2 text-green-500" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                By creating an account or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                <li>You must be at least 13 years old to use this Service</li>
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You agree to notify us immediately of any unauthorized use of your account</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                User Accounts and Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Account Security</h4>
                <ul className="list-disc pl-6 space-y-1 text-blue-800 dark:text-blue-300 text-sm">
                  <li>Choose a strong, unique password</li>
                  <li>Do not share your account credentials with others</li>
                  <li>Log out from shared or public devices</li>
                  <li>Report any suspicious activity immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content and Conduct */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-500" />
                Content and Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content").
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Your Content</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>You retain ownership of content you create and share</li>
                    <li>You grant us a license to use, display, and distribute your content</li>
                    <li>You are responsible for your content and its legality</li>
                    <li>You must not post content that violates our Community Guidelines</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prohibited Uses</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Harassment, bullying, or threatening other users</li>
                    <li>Posting illegal, harmful, or offensive content</li>
                    <li>Impersonating others or providing false information</li>
                    <li>Attempting to hack, disrupt, or overload our systems</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Data Rights</h4>
                <ul className="list-disc pl-6 space-y-1 text-green-800 dark:text-green-300 text-sm">
                  <li>Right to access your personal data</li>
                  <li>Right to correct inaccurate information</li>
                  <li>Right to delete your account and data</li>
                  <li>Right to data portability</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You may also terminate your account at any time by contacting us or using the account deletion feature in your settings.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle>Disclaimers and Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                The information on this Service is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms.
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">Service Availability</h4>
                <p className="text-orange-800 dark:text-orange-300 text-sm">
                  We strive to maintain high availability but cannot guarantee uninterrupted service. We may need to suspend the service for maintenance or updates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  Contact Support
                </Button>
                <Link href="/community-guidelines">
                  <Button variant="ghost">
                    Community Guidelines
                  </Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="ghost">
                    Privacy Policy
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}