"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import * as stylex from "@stylexjs/stylex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import hostelsData from "@/data/hostels.json";
import { useSearchParams } from "next/navigation";
import { breakpoints, colors, fonts, motion, radii } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

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
    text: "Need to visit the hospital for a medical appointment and follow-up treatment.",
  },
  {
    label: "Festival - Religious/cultural celebration",
    text: "Going home to celebrate the upcoming festival with family.",
  },
  {
    label: "Visiting home - Family time/personal work",
    text: "Visiting home to spend time with family and attend to personal matters.",
  },
  {
    label: "Family event - Wedding/function/occasion",
    text: "Attending a family wedding and related ceremonies.",
  },
  {
    label: "Emergency - Urgent family matter",
    text: "Urgent family emergency requires immediate presence at home.",
  },
  {
    label: "Academic purpose - Conference/competition/exam",
    text: "Participating in an academic conference relevant to my field of study.",
  },
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

type Hostel = (typeof hostelsData)[number];

/** Display-ready `To`/`Cc` lines for the mail preview. */
type MailRecipients = { to: string[]; cc: string[] };

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

const styles = stylex.create({
  sharedNotice: {
    marginBottom: "1.5rem",
    borderColor: `color-mix(in oklab, ${colors.blue} 34%, ${colors.border})`,
    backgroundColor: `color-mix(in oklab, ${colors.blue} 8%, ${colors.card})`,
  },
  noticeContent: { padding: "1.5rem" },
  noticeTitle: {
    marginBottom: "0.5rem",
    fontFamily: fonts.serif,
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    fontWeight: 600,
  },
  pageHeader: { marginBottom: "2rem" },
  formStack: { display: "grid", gap: "2rem" },
  cardHeader: { paddingBottom: "1rem" },
  cardContent: { display: "grid", gap: "1.5rem" },
  gridTwo: {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [breakpoints.sm]: "repeat(2, minmax(0, 1fr))",
    },
  },
  gridThree: {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [breakpoints.sm]: "repeat(3, minmax(0, 1fr))",
    },
  },
  fieldLabel: { display: "block", marginBottom: "0.5rem" },
  fieldLabelLarge: { display: "block", marginBottom: "0.75rem" },
  formControl: {
    display: "flex",
    width: "100%",
    minWidth: 0,
    height: "2.25rem",
    borderRadius: radii.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { default: colors.input, ":focus-visible": colors.ring },
    backgroundColor: "transparent",
    paddingInline: "0.75rem",
    paddingBlock: "0.25rem",
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: { default: "1rem", [breakpoints.md]: "0.875rem" },
    lineHeight: { default: "1.5rem", [breakpoints.md]: "1.25rem" },
    outline: "none",
    boxShadow: {
      default: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
    transitionProperty: "color, border-color, box-shadow",
    transitionDuration: motion.fast,
  },
  textarea: {
    minHeight: "6.25rem",
    height: "auto",
    resize: "vertical",
    padding: "0.75rem",
  },
  tallInput: { height: "2.75rem" },
  wardenList: { display: "grid", gap: "0.75rem" },
  warden: { display: "flex", alignItems: "center", gap: "0.75rem" },
  checkbox: {
    width: "1rem",
    height: "1rem",
    borderRadius: radii.sm,
    accentColor: colors.primary,
  },
  helperTop: { marginTop: "0.75rem" },
  inset: { padding: "1rem", borderRadius: radii.md, backgroundColor: colors.muted },
  insetSmall: { marginTop: "0.5rem", padding: "0.75rem" },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "1rem",
  },
  alert: {
    padding: "1rem",
    borderRadius: radii.lg,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `color-mix(in oklab, ${colors.rose} 42%, ${colors.border})`,
    backgroundColor: `color-mix(in oklab, ${colors.rose} 10%, ${colors.card})`,
  },
  alertTitle: { marginBottom: "0.5rem", fontWeight: 500 },
  previewBody: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontFamily: fonts.mono,
    fontSize: "0.875rem",
    lineHeight: 1.625,
  },
  shareBox: {
    padding: "1rem",
    borderRadius: radii.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `color-mix(in oklab, ${colors.blue} 34%, ${colors.border})`,
    backgroundColor: `color-mix(in oklab, ${colors.blue} 8%, ${colors.card})`,
  },
  shareTitle: { marginBottom: "0.5rem", fontWeight: 500 },
  shareDescription: { marginBottom: "0.75rem" },
  shareRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  shareInput: {
    minWidth: 0,
    backgroundColor: colors.background,
    fontFamily: fonts.mono,
    fontSize: "0.75rem",
  },
});

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
    selectedWardens: [],
  });

  const [mailPreview, setMailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Load form data from URL parameters if present
  useEffect(() => {
    const dataParam = searchParams.get("data");
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
        console.error("Failed to parse shared link data:", e);
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const durationText = useMemo(
    () => describeDuration(formData.startDate, formData.endDate),
    [formData.startDate, formData.endDate],
  );

  const generateMailFromData = (data: FormData) => {
    const subject = `${data.studentName}, ${data.registrationNumber} and ${data.block} ${data.roomNumber}`;

    const purposeText =
      data.purpose === "custom"
        ? data.customPurpose
        : PURPOSE_TEXT_BY_LABEL.get(data.purpose) || data.purpose;

    const durationText = describeDuration(data.startDate, data.endDate);

    const body = `1. Student name: ${data.studentName || "[NOT FILLED]"}
2. Registration Number: ${data.registrationNumber || "[NOT FILLED]"}
3. Semester & Branch: ${data.semester ? data.semester + " Semester, " : "[NOT FILLED] "}${data.branch || "[NOT FILLED]"}
4. Block and Room Number: ${data.block || "[NOT FILLED]"}${data.roomNumber ? " - Room " + data.roomNumber : " [NOT FILLED]"}
5. Contact number of Student: ${data.contactNumber || "[NOT FILLED]"}
6. Duration of leave and dates: ${durationText || "[NOT FILLED]"}
7. Place of visit, address in detail and purpose: ${data.placeOfVisit || "[NOT FILLED]"}
${data.address || "[NOT FILLED]"}
Purpose: ${purposeText || "[NOT FILLED]"}
8. Parents name & contact details: ${data.parentName || "[NOT FILLED]"} - ${data.parentContact || "[NOT FILLED]"}
9. Parent's undertaking for the student's leave: ${data.parentName ? `I, ${data.parentName}, hereby undertake full responsibility for my ward ${data.studentName || "[STUDENT NAME NOT FILLED]"}'s leave during the period mentioned above and ensure that they will maintain discipline and adhere to all rules and regulations.` : "[NOT FILLED - Parent name required]"}`;

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
      .filter((warden) => selectedWardenSet.has(warden.name))
      .map((warden) => warden.email);

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
      console.error("Failed to copy link:", err);
    }
  };

  const recipients = useMemo((): MailRecipients => {
    if (!selectedHostel || selectedWardenSet.size === 0) {
      return { to: [], cc: [] };
    }

    return {
      to: selectedHostel.wardens
        .filter((warden) => selectedWardenSet.has(warden.name))
        .map((warden) => `${warden.name} <${warden.email}>`),
      cc: [`${selectedHostel.block} <${selectedHostel.email}>`],
    };
  }, [selectedHostel, selectedWardenSet]);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.studentName) missing.push("Student Name");
    if (!formData.registrationNumber) missing.push("Registration Number");
    if (!formData.semester) missing.push("Semester");
    if (!formData.branch) missing.push("Branch");
    if (!formData.block) missing.push("Block");
    if (!formData.roomNumber) missing.push("Room Number");
    if (!formData.contactNumber) missing.push("Contact Number");
    if (!formData.startDate || !formData.endDate) missing.push("Leave Dates");
    if (!formData.placeOfVisit) missing.push("Place of Visit");
    if (!formData.address) missing.push("Address");
    if (!formData.purpose || (formData.purpose === "custom" && !formData.customPurpose))
      missing.push("Purpose");
    if (!formData.parentName) missing.push("Parent Name");
    if (!formData.parentContact) missing.push("Parent Contact");
    if (formData.selectedWardens.length === 0) missing.push("Warden Selection");
    return missing;
  }, [formData]);

  return (
    <main {...stylex.props(shared.page, shared.pageNarrow)}>
      {isSharedLink && (
        <Card xstyle={styles.sharedNotice}>
          <CardContent xstyle={styles.noticeContent}>
            <h2 {...stylex.props(styles.noticeTitle)}>
              Parent/Guardian: Leave Request Ready to Send
            </h2>
            <p {...stylex.props(shared.textSm, shared.mutedText)}>
              Your ward has prepared a leave request for hostel warden approval. Please review all
              the details below, make any necessary corrections, scroll down to preview the email,
              and click &quot;Send Email to Warden&quot; to send it from your email account.
            </p>
          </CardContent>
        </Card>
      )}

      <div {...stylex.props(styles.pageHeader)}>
        <h1 {...stylex.props(shared.heading1)}>Generate Mail to Warden</h1>
        <p {...stylex.props(shared.mutedText)}>
          Generate a formal leave request email for your hostel warden.
        </p>
      </div>

      <div {...stylex.props(styles.formStack)}>
        <Card>
          <CardHeader xstyle={styles.cardHeader}>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent xstyle={styles.cardContent}>
            <div {...stylex.props(styles.gridTwo)}>
              <div>
                <Label htmlFor="studentName" xstyle={styles.fieldLabel}>
                  Student Name
                </Label>
                <Input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) => handleInputChange("studentName", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber" xstyle={styles.fieldLabel}>
                  Registration Number
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                  placeholder="e.g., 211234567"
                />
              </div>
            </div>

            <div {...stylex.props(styles.gridThree)}>
              <div>
                <Label htmlFor="semester" xstyle={styles.fieldLabel}>
                  Semester
                </Label>
                <select
                  id="semester"
                  {...stylex.props(styles.formControl)}
                  value={formData.semester}
                  onChange={(e) => handleInputChange("semester", e.target.value)}
                >
                  <option value="">Select Semester</option>
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="branch" xstyle={styles.fieldLabel}>
                  Branch
                </Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  placeholder="e.g., CSE, ECE, Mechanical"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber" xstyle={styles.fieldLabel}>
                  Contact Number
                </Label>
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
          <CardHeader xstyle={styles.cardHeader}>
            <CardTitle>Hostel Information</CardTitle>
          </CardHeader>
          <CardContent xstyle={styles.cardContent}>
            <div {...stylex.props(styles.gridTwo)}>
              <div>
                <Label htmlFor="block" xstyle={styles.fieldLabel}>
                  Block
                </Label>
                <select
                  id="block"
                  {...stylex.props(styles.formControl)}
                  value={formData.block}
                  onChange={(e) => {
                    handleInputChange("block", e.target.value);
                    handleInputChange("selectedWardens", []);
                  }}
                >
                  <option value="">Select Block</option>
                  {BLOCKS.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="roomNumber" xstyle={styles.fieldLabel}>
                  Room Number
                </Label>
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
                <Label xstyle={styles.fieldLabelLarge}>Select Warden(s)</Label>
                <div {...stylex.props(styles.wardenList)}>
                  {selectedHostel.wardens.map((warden, wardenIndex) => {
                    const wardenId = `warden-${wardenIndex}`;
                    return (
                      <div key={warden.name} {...stylex.props(styles.warden)}>
                        <input
                          id={wardenId}
                          type="checkbox"
                          checked={selectedWardenSet.has(warden.name)}
                          onChange={(e) => {
                            const updated = new Set(selectedWardenSet);
                            if (e.target.checked) updated.add(warden.name);
                            else updated.delete(warden.name);
                            handleInputChange("selectedWardens", Array.from(updated));
                          }}
                          {...stylex.props(styles.checkbox)}
                        />
                        <div>
                          <label htmlFor={wardenId}>{warden.name}</label>
                          <p {...stylex.props(shared.textSm, shared.mutedText)}>
                            {warden.designation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p {...stylex.props(shared.textSm, shared.mutedText, styles.helperTop)}>
                  CC will be sent to: {selectedHostel.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader xstyle={styles.cardHeader}>
            <CardTitle>Leave Details</CardTitle>
          </CardHeader>
          <CardContent xstyle={styles.cardContent}>
            <div {...stylex.props(styles.gridTwo)}>
              <div>
                <Label htmlFor="startDate" xstyle={styles.fieldLabel}>
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  xstyle={styles.tallInput}
                />
              </div>
              <div>
                <Label htmlFor="endDate" xstyle={styles.fieldLabel}>
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  xstyle={styles.tallInput}
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div {...stylex.props(styles.inset)}>
                <p {...stylex.props(shared.textSm)}>Duration: {durationText}</p>
              </div>
            )}

            <div>
              <Label htmlFor="placeOfVisit" xstyle={styles.fieldLabel}>
                Place of Visit
              </Label>
              <Input
                id="placeOfVisit"
                value={formData.placeOfVisit}
                onChange={(e) => handleInputChange("placeOfVisit", e.target.value)}
                placeholder="e.g., Bangalore, Mumbai, Delhi"
              />
            </div>

            <div>
              <Label htmlFor="address" xstyle={styles.fieldLabel}>
                Detailed Address
              </Label>
              <textarea
                id="address"
                {...stylex.props(styles.formControl, styles.textarea)}
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter the complete address where you will be staying"
              />
            </div>

            <div>
              <Label htmlFor="purpose" xstyle={styles.fieldLabel}>
                Purpose
              </Label>
              <select
                id="purpose"
                {...stylex.props(styles.formControl)}
                value={formData.purpose}
                onChange={(e) => handleInputChange("purpose", e.target.value)}
              >
                <option value="">Select Purpose</option>
                {PURPOSE_TEMPLATES.map((purpose) => (
                  <option key={purpose.label} value={purpose.label}>
                    {purpose.label}
                  </option>
                ))}
                <option value="custom">Custom Purpose</option>
              </select>

              {formData.purpose && formData.purpose !== "custom" && (
                <div {...stylex.props(styles.inset, styles.insetSmall)}>
                  <p {...stylex.props(shared.textSm)}>
                    {PURPOSE_TEXT_BY_LABEL.get(formData.purpose)}
                  </p>
                </div>
              )}
            </div>

            {formData.purpose === "custom" && (
              <div>
                <Label htmlFor="customPurpose" xstyle={styles.fieldLabel}>
                  Custom Purpose
                </Label>
                <textarea
                  id="customPurpose"
                  {...stylex.props(styles.formControl, styles.textarea)}
                  value={formData.customPurpose}
                  onChange={(e) => handleInputChange("customPurpose", e.target.value)}
                  placeholder="Enter custom purpose details"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader xstyle={styles.cardHeader}>
            <CardTitle>Parent Information</CardTitle>
          </CardHeader>
          <CardContent xstyle={styles.cardContent}>
            <div {...stylex.props(styles.gridTwo)}>
              <div>
                <Label htmlFor="parentName" xstyle={styles.fieldLabel}>
                  Parent Name
                </Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => handleInputChange("parentName", e.target.value)}
                  placeholder="Father's or Mother's name"
                />
              </div>
              <div>
                <Label htmlFor="parentContact" xstyle={styles.fieldLabel}>
                  Parent Contact
                </Label>
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

        <div {...stylex.props(styles.actions)}>
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
            <CardHeader>
              <CardTitle>Mail Preview</CardTitle>
            </CardHeader>
            <CardContent xstyle={styles.cardContent}>
              {missingFields.length > 0 && (
                <div role="alert" {...stylex.props(styles.alert)}>
                  <p {...stylex.props(shared.textSm, styles.alertTitle)}>
                    Please fill in the following required fields:
                  </p>
                  <p {...stylex.props(shared.textSm)}>{missingFields.join(", ")}</p>
                </div>
              )}

              {recipients.to.length > 0 && (
                <div>
                  <Label xstyle={styles.fieldLabelLarge}>To</Label>
                  <div {...stylex.props(styles.inset)}>
                    <p {...stylex.props(shared.textSm)}>{recipients.to.join(", ")}</p>
                  </div>
                </div>
              )}

              {recipients.cc.length > 0 && (
                <div>
                  <Label xstyle={styles.fieldLabelLarge}>CC</Label>
                  <div {...stylex.props(styles.inset)}>
                    <p {...stylex.props(shared.textSm)}>{recipients.cc.join(", ")}</p>
                  </div>
                </div>
              )}

              <div>
                <Label xstyle={styles.fieldLabelLarge}>Subject</Label>
                <div {...stylex.props(styles.inset)}>{mailPreview.subject}</div>
              </div>
              <div>
                <Label xstyle={styles.fieldLabelLarge}>Body</Label>
                <pre {...stylex.props(styles.inset, styles.previewBody)}>{mailPreview.body}</pre>
              </div>

              {shareableLink && !isSharedLink && (
                <div>
                  <Label xstyle={styles.fieldLabelLarge}>Shareable Link for Parents</Label>
                  <div {...stylex.props(styles.shareBox)}>
                    <p {...stylex.props(shared.textSm, styles.shareTitle)}>
                      Share this link with your parents via WhatsApp, SMS, or email
                    </p>
                    <p {...stylex.props(shared.textXs, shared.mutedText, styles.shareDescription)}>
                      When they click this link, they&apos;ll see this page with all the information
                      pre-filled. They can review everything and click &quot;Send Mail&quot; to send
                      the leave request from their email.
                    </p>
                    <div {...stylex.props(styles.shareRow)}>
                      <Input
                        value={shareableLink}
                        readOnly
                        xstyle={styles.shareInput}
                        onClick={(e) => e.currentTarget.select()}
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
    <Suspense
      fallback={
        <main {...stylex.props(shared.page, shared.pageNarrow)}>
          <div {...stylex.props(styles.pageHeader)}>
            <h1 {...stylex.props(shared.heading1)}>Generate Mail to Warden</h1>
            <p {...stylex.props(shared.mutedText)}>Loading...</p>
          </div>
        </main>
      }
    >
      <MailToWardenContent />
    </Suspense>
  );
}
