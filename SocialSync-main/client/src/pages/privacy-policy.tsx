import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: June 25, 2025
          </p>
        </div>

        {/* Privacy Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                Your Privacy Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                This Privacy Policy describes how we collect, use, and protect your personal information when you use our social media platform. We are committed to protecting your privacy and being transparent about our data practices.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-500" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Information You Provide</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Account information (email, username, profile details)</li>
                  <li>Content you create and share (posts, comments, messages)</li>
                  <li>Profile information and preferences</li>
                  <li>Communications with us (support requests, feedback)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Information We Collect Automatically</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Device information (browser type, operating system)</li>
                  <li>Log data (IP address, access times, error logs)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-500" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Service Provision</h4>
                  <ul className="list-disc pl-6 space-y-1 text-blue-800 dark:text-blue-300 text-sm">
                    <li>Create and manage your account</li>
                    <li>Enable social features and connections</li>
                    <li>Personalize your experience</li>
                    <li>Provide customer support</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Service Improvement</h4>
                  <ul className="list-disc pl-6 space-y-1 text-green-800 dark:text-green-300 text-sm">
                    <li>Analyze usage patterns</li>
                    <li>Develop new features</li>
                    <li>Fix bugs and improve performance</li>
                    <li>Conduct research and analytics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-orange-500" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
                <li><strong>Public content:</strong> Information you choose to make public (posts, profile info)</li>
                <li><strong>Service providers:</strong> Third parties that help us operate our service</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Business transfers:</strong> In case of merger, acquisition, or asset sale</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-red-500" />
                Data Security and Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Security Measures</h4>
                <ul className="list-disc pl-6 space-y-1 text-red-800 dark:text-red-300 text-sm">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and assessments</li>
                  <li>Access controls and authentication systems</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Access and Control</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                    <li>View and download your data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and data</li>
                    <li>Control privacy settings</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Data Management</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                    <li>Object to certain processing</li>
                    <li>Restrict data processing</li>
                    <li>Data portability options</li>
                    <li>Withdraw consent</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Cookie Types</h4>
                <ul className="list-disc pl-6 space-y-1 text-yellow-800 dark:text-yellow-300 text-sm">
                  <li><strong>Essential:</strong> Required for basic site functionality</li>
                  <li><strong>Analytics:</strong> Help us understand how you use our service</li>
                  <li><strong>Functional:</strong> Remember your preferences and settings</li>
                  <li><strong>Advertising:</strong> Deliver relevant ads (with your consent)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us About Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  Privacy Support
                </Button>
                <Button variant="outline">
                  Data Request
                </Button>
                <Link href="/terms">
                  <Button variant="ghost">
                    Terms of Service
                  </Button>
                </Link>
                <Link href="/community-guidelines">
                  <Button variant="ghost">
                    Community Guidelines
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