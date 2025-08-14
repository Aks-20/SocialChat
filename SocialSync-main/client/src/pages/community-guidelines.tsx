import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Users, Heart, AlertTriangle, Flag } from "lucide-react";
import { Link } from "wouter";

export default function CommunityGuidelinesPage() {
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
            Community Guidelines
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Our community guidelines help create a safe, inclusive, and welcoming environment for everyone.
          </p>
        </div>

        {/* Guidelines Content */}
        <div className="space-y-6">
          {/* Be Respectful */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Be Respectful and Kind
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Treat all community members with respect and kindness. We celebrate diversity and welcome people from all backgrounds.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Use inclusive language that makes everyone feel welcome</li>
                <li>Be patient with newcomers and those learning</li>
                <li>Respect different opinions and perspectives</li>
                <li>Avoid personal attacks, harassment, or bullying</li>
              </ul>
            </CardContent>
          </Card>

          {/* Safety First */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                Safety and Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Your safety and privacy are our top priorities. Help us maintain a secure environment for everyone.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Don't share personal information like addresses, phone numbers, or private details</li>
                <li>Report any suspicious or harmful behavior immediately</li>
                <li>Don't engage in or promote illegal activities</li>
                <li>Respect others' privacy and don't share their content without permission</li>
              </ul>
            </CardContent>
          </Card>

          {/* Community Standards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Community Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Help us maintain high-quality discussions and content that everyone can enjoy.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Keep content relevant and appropriate for the community</li>
                <li>No spam, excessive self-promotion, or irrelevant advertising</li>
                <li>Use clear, descriptive titles for posts and discussions</li>
                <li>Give credit where credit is due and respect intellectual property</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prohibited Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Prohibited Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                The following types of content are not allowed and will result in immediate action:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Hate speech, discrimination, or content promoting violence</li>
                <li>Adult content, nudity, or sexually explicit material</li>
                <li>Content involving minors in inappropriate contexts</li>
                <li>Misinformation, false news, or harmful conspiracy theories</li>
                <li>Content that violates intellectual property rights</li>
                <li>Doxxing or sharing someone's private information</li>
              </ul>
            </CardContent>
          </Card>

          {/* Reporting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flag className="w-5 h-5 mr-2 text-purple-500" />
                Reporting and Enforcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Help us keep the community safe by reporting violations and understanding our enforcement process.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Report</h4>
                <ul className="list-disc pl-6 space-y-1 text-blue-800 dark:text-blue-300 text-sm">
                  <li>Use the report button on posts, comments, or profiles</li>
                  <li>Contact our support team for serious violations</li>
                  <li>Provide specific details about the violation</li>
                  <li>Block users who are bothering you</li>
                </ul>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">Enforcement Actions</h4>
                <ul className="list-disc pl-6 space-y-1 text-orange-800 dark:text-orange-300 text-sm">
                  <li>Warning for minor violations</li>
                  <li>Temporary suspension for repeated violations</li>
                  <li>Permanent ban for serious or repeated violations</li>
                  <li>Content removal and account restrictions</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Questions or Concerns?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about these guidelines or need to report a serious issue, don't hesitate to contact us.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  Contact Support
                </Button>
                <Button variant="outline">
                  Report Content
                </Button>
                <Link href="/terms">
                  <Button variant="ghost">
                    Terms of Service
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

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These guidelines were last updated on June 25, 2025. We may update them from time to time to better serve our community.
          </p>
        </div>
      </div>
    </div>
  );
}