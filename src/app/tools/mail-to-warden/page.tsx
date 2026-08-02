"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import hostelsData from "@/data/hostels.json";
import { useSearchParams } from "next/navigation";



interface FormData {
  studentName: string;
  registrationNumber: string;
  semester: string;
  branch: string;
  block: string;
  roomNumber: string;
  contactNumber: string;
  startDate: string;
  endDate: string;
  placeOfVisit: string;
  address: string;
  purpose: string;
  customPurpose: string;
  parentName: string;
  parentContact: string;
  selectedWardens: string[];
}

const PURPOSE_TEMPLATES = [
  {
    label: "Health issues - Medical appointment/treatment",
    text: "Need to visit the hospital for a medical appointment and follow-up treatment."
  },
  {
    label: "Festival - Religious/cultural celebration", 
    text: "Going home to celebrate the upcoming festival with family."
  },
  {
    label: "Visiting home - Family time/personal work",
    text: "Visiting home to spend time with family and attend to personal matters."
  },
  {
    label: "Family event - Wedding/function/occasion",
    text: "Attending a family wedding and related ceremonies."
  },
  {
    label: "Emergency - Urgent family matter",
    text: "Urgent family emergency requires immediate presence at home."
  },
  {
    label: "Academic purpose - Conference/competition/exam",
    text: "Participating in an academic conference relevant to my field of study."
  }
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

type Hostel = (typeof hostelsData)[number];

/**
 * The form re-renders on every keystroke in any of its fourteen fields, so
 * anything derived from the static hostel data is built once here rather than
 * rescanned on each of those renders.
 */
const HOSTELS_BY_BLOCK = new Map<string, Hostel>(
  hostelsData.map((hostel) => [hostel.block, hostel]),
);
const BLOCKS: readonly string[] = hostelsData.map((hostel) => hostel.block);
const PURPOSE_TEXT_BY_LABEL = new Map(
  PURPOSE_TEMPLATES.map((purpose) => [purpose.label, purpose.text]),
);

/**
 * `toLocaleDateString` builds a formatter on every call. One shared instance
 * covers both dates in the duration line.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function describeDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86_400_000) + 1;

  return `${days} day(s) from ${DATE_FORMAT.format(start)} to ${DATE_FORMAT.format(end)}`;
}

function MailToWardenContent() {
  const searchParams = useSearchParams();
  const [isSharedLink, setIsSharedLink] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    studentName: "",
    registrationNumber: "",
    semester: "",
    branch: "",
    block: "",
    roomNumber: "",
    contactNumber: "",
    startDate: "",
    endDate: "",
    placeOfVisit: "",
    address: "",
    purpose: "",
    customPurpose: "",
    parentName: "",
    parentContact: "",
    selectedWardens: []
  });

  const [mailPreview, setMailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Load form data from URL parameters if present
  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setFormData(decodedData);
        setIsSharedLink(true);
        // Auto-generate preview for shared links
        setTimeout(() => {
          generateMailFromData(decodedData);
        }, 100);
      } catch (e) {
        console.error('Failed to parse shared link data:', e);
      }
    }
  }, [searchParams]);

  const selectedHostel = HOSTELS_BY_BLOCK.get(formData.block);

  /** Membership is checked once per warden checkbox, so keep it O(1). */
  const selectedWardenSet = useMemo(
    () => new Set(formData.selectedWardens),
    [formData.selectedWardens],
  );

  const handleInputChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const durationText = useMemo(
    () => describeDuration(formData.startDate, formData.endDate),
    [formData.startDate, formData.endDate],
  );

  const generateMailFromData = (data: FormData) => {
    const subject = `${data.studentName}, ${data.registrationNumber} and ${data.block} ${data.roomNumber}`;

    const purposeText = data.purpose === "custom"
      ? data.customPurpose
      : PURPOSE_TEXT_BY_LABEL.get(data.purpose) || data.purpose;

    const durationText = describeDuration(data.startDate, data.endDate);

    const body = `1. Student name: ${data.studentName || '[NOT FILLED]'}
2. Registration Number: ${data.registrationNumber || '[NOT FILLED]'}
3. Semester & Branch: ${data.semester ? data.semester + ' Semester, ' : '[NOT FILLED] '}${data.branch || '[NOT FILLED]'}
4. Block and Room Number: ${data.block || '[NOT FILLED]'}${data.roomNumber ? ' - Room ' + data.roomNumber : ' [NOT FILLED]'}
5. Contact number of Student: ${data.contactNumber || '[NOT FILLED]'}
6. Duration of leave and dates: ${durationText || '[NOT FILLED]'}
7. Place of visit, address in detail and purpose: ${data.placeOfVisit || '[NOT FILLED]'}
${data.address || '[NOT FILLED]'}
Purpose: ${purposeText || '[NOT FILLED]'}
8. Parents name & contact details: ${data.parentName || '[NOT FILLED]'} - ${data.parentContact || '[NOT FILLED]'}
9. Parent's undertaking for the student's leave: ${data.parentName ? `I, ${data.parentName}, hereby undertake full responsibility for my ward ${data.studentName || '[STUDENT NAME NOT FILLED]'}'s leave during the period mentioned above and ensure that they will maintain discipline and adhere to all rules and regulations.` : '[NOT FILLED - Parent name required]'}`;

    setMailPreview({ subject, body });

    // Generate shareable web URL (not mailto)
    const hostel = HOSTELS_BY_BLOCK.get(data.block);
    if (hostel && data.selectedWardens.length > 0) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(JSON.stringify(data))}`;
      setShareableLink(shareUrl);
    }
  };

  const generateMail = () => {
    generateMailFromData(formData);
  };

  const sendMail = () => {
    if (!mailPreview || !selectedHostel) return;

    const selectedWardenEmails = selectedHostel.wardens
      .filter(warden => selectedWardenSet.has(warden.name))
      .map(warden => warden.email);

    if (selectedWardenEmails.length === 0) return;

    const to = selectedWardenEmails.join(",");
    const cc = selectedHostel.email;

    const mailtoUrl = `mailto:${to}?cc=${cc}&subject=${encodeURIComponent(mailPreview.subject)}&body=${encodeURIComponent(mailPreview.body)}`;

    window.open(mailtoUrl);
  };

  const copyShareableLink = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const recipients = useMemo(() => {
    if (!selectedHostel || selectedWardenSet.size === 0) {
      return { to: [] as string[], cc: [] as string[] };
    }

    return {
      to: selectedHostel.wardens
        .filter(warden => selectedWardenSet.has(warden.name))
        .map(warden => `${warden.name} <${warden.email}>`),
      cc: [`${selectedHostel.block} <${selectedHostel.email}>`],
    };
  }, [selectedHostel, selectedWardenSet]);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.studentName) missing.push('Student Name');
    if (!formData.registrationNumber) missing.push('Registration Number');
    if (!formData.semester) missing.push('Semester');
    if (!formData.branch) missing.push('Branch');
    if (!formData.block) missing.push('Block');
    if (!formData.roomNumber) missing.push('Room Number');
    if (!formData.contactNumber) missing.push('Contact Number');
    if (!formData.startDate || !formData.endDate) missing.push('Leave Dates');
    if (!formData.placeOfVisit) missing.push('Place of Visit');
    if (!formData.address) missing.push('Address');
    if (!formData.purpose || (formData.purpose === 'custom' && !formData.customPurpose)) missing.push('Purpose');
    if (!formData.parentName) missing.push('Parent Name');
    if (!formData.parentContact) missing.push('Parent Contact');
    if (formData.selectedWardens.length === 0) missing.push('Warden Selection');
    return missing;
  }, [formData]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {isSharedLink && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Parent/Guardian: Leave Request Ready to Send</h2>
            <p className="text-sm text-muted-foreground mb-0">
              Your ward has prepared a leave request for hostel warden approval.
              Please review all the details below, make any necessary corrections, scroll down to preview the email, and click &quot;Send Email to Warden&quot; to send it from your email account.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <h1 className="text-3xl">Generate Mail to Warden</h1>
        <p className="text-muted-foreground">Generate a formal leave request email for your hostel warden.</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="studentName" className="mb-2 block">Student Name</Label>
                <Input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) => handleInputChange("studentName", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber" className="mb-2 block">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                  placeholder="e.g., 211234567"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="semester" className="mb-2 block">Semester</Label>
                <select
                  id="semester"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  value={formData.semester}
                  onChange={(e) => handleInputChange("semester", e.target.value)}
                >
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="branch" className="mb-2 block">Branch</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  placeholder="e.g., CSE, ECE, Mechanical"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber" className="mb-2 block">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  placeholder="Your mobile number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Hostel Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="block" className="mb-2 block">Block</Label>
                <select
                  id="block"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  value={formData.block}
                  onChange={(e) => {
                    handleInputChange("block", e.target.value);
                    handleInputChange("selectedWardens", []);
                  }}
                >
                  <option value="">Select Block</option>
                  {BLOCKS.map(block => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="roomNumber" className="mb-2 block">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                  placeholder="e.g., A-101, 204"
                />
              </div>
            </div>

            {selectedHostel && (
              <div>
                <Label className="mb-3 block">Select Warden(s)</Label>
                <div className="space-y-3">
                  {selectedHostel.wardens.map(warden => (
                    <label key={warden.name} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedWardenSet.has(warden.name)}
                        onChange={(e) => {
                          const updated = new Set(selectedWardenSet);
                          if (e.target.checked) updated.add(warden.name);
                          else updated.delete(warden.name);
                          handleInputChange("selectedWardens", Array.from(updated));
                        }}
                        className="rounded"
                      />
                      <div>
                        <span>{warden.name}</span>
                        <p className="text-sm text-muted-foreground">{warden.designation}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  CC will be sent to: {selectedHostel.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Leave Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate" className="mb-2 block">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-2 block">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Duration: {durationText}</p>
              </div>
            )}

            <div>
              <Label htmlFor="placeOfVisit" className="mb-2 block">Place of Visit</Label>
              <Input
                id="placeOfVisit"
                value={formData.placeOfVisit}
                onChange={(e) => handleInputChange("placeOfVisit", e.target.value)}
                placeholder="e.g., Bangalore, Mumbai, Delhi"
              />
            </div>

            <div>
              <Label htmlFor="address" className="mb-2 block">Detailed Address</Label>
              <textarea
                id="address"
                className="w-full p-3 border rounded-md min-h-[100px]"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter the complete address where you will be staying"
              />
            </div>

            <div>
              <Label htmlFor="purpose" className="mb-2 block">Purpose</Label>
              <select
                id="purpose"
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                value={formData.purpose}
                onChange={(e) => handleInputChange("purpose", e.target.value)}
              >
                <option value="">Select Purpose</option>
                {PURPOSE_TEMPLATES.map(purpose => (
                  <option key={purpose.label} value={purpose.label}>{purpose.label}</option>
                ))}
                <option value="custom">Custom Purpose</option>
              </select>
              
              {formData.purpose && formData.purpose !== "custom" && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    {PURPOSE_TEXT_BY_LABEL.get(formData.purpose)}
                  </p>
                </div>
              )}
            </div>

            {formData.purpose === "custom" && (
              <div>
                <Label htmlFor="customPurpose" className="mb-2 block">Custom Purpose</Label>
                <textarea
                  id="customPurpose"
                  className="w-full p-3 border rounded-md min-h-[100px]"
                  value={formData.customPurpose}
                  onChange={(e) => handleInputChange("customPurpose", e.target.value)}
                  placeholder="Enter custom purpose details"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Parent Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="parentName" className="mb-2 block">Parent Name</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => handleInputChange("parentName", e.target.value)}
                  placeholder="Father's or Mother's name"
                />
              </div>
              <div>
                <Label htmlFor="parentContact" className="mb-2 block">Parent Contact</Label>
                <Input
                  id="parentContact"
                  value={formData.parentContact}
                  onChange={(e) => handleInputChange("parentContact", e.target.value)}
                  placeholder="Parent's mobile number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button onClick={generateMail} variant="outline" size="lg">
            Preview Mail
          </Button>
          {mailPreview && (
            <>
              <Button onClick={sendMail} size="lg">
                {isSharedLink ? "Send Email to Warden" : "Send Mail"}
              </Button>
              {shareableLink && !isSharedLink && (
                <Button onClick={copyShareableLink} variant="secondary" size="lg">
                  {linkCopied ? "Link Copied!" : "Share with Parent"}
                </Button>
              )}
            </>
          )}
        </div>

        {mailPreview && (
          <Card>
            <CardHeader className="pb-6">
              <CardTitle>Mail Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {missingFields.length > 0 && (
                <div className="glass border border-rose-200/50 bg-rose-50/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-white mb-2">
                    Please fill in the following required fields:
                  </p>
                  <p className="text-sm text-white">
                    {missingFields.join(', ')}
                  </p>
                </div>
              )}

              {recipients.to.length > 0 && (
                <div>
                  <Label className="mb-3 block">To</Label>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm">
                      {recipients.to.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {recipients.cc.length > 0 && (
                <div>
                  <Label className="mb-3 block">CC</Label>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm">
                      {recipients.cc.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-3 block">Subject</Label>
                <div className="p-4 bg-muted rounded-md">
                  {mailPreview.subject}
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Body</Label>
                <pre className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                  {mailPreview.body}
                </pre>
              </div>

              {shareableLink && !isSharedLink && (
                <div>
                  <Label className="mb-3 block">Shareable Link for Parents</Label>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200">
                    <p className="text-sm font-medium mb-2">
                      Share this link with your parents via WhatsApp, SMS, or email
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      When they click this link, they&apos;ll see this page with all the information pre-filled.
                      They can review everything and click &quot;Send Mail&quot; to send the leave request from their email.
                    </p>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={shareableLink}
                        readOnly
                        className="font-mono text-xs bg-white dark:bg-gray-800"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button onClick={copyShareableLink} size="sm" variant="default">
                        {linkCopied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default function MailToWardenPage() {
  return (
    <Suspense fallback={
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl">Generate Mail to Warden</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    }>
      <MailToWardenContent />
    </Suspense>
  );
}