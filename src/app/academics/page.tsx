"use client";

import { memo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite-button";

const AcademicCard = memo(function AcademicCard({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: ReactNode;
}) {
  return (
    <Card
      className="glass hover:shadow-lg transition-colors mb-4 break-inside-avoid scroll-mt-24 relative group"
      id={slugify(title)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <FavoriteButton
            item={{
              id: `academic-${slugify(title)}`,
              type: "academic",
              name: title,
              href: url,
              subtitle: "Academic Resource",
            }}
            size="sm"
          />
        </div>
      </CardHeader>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 z-0"
        aria-label={`Open ${title}`}
      />
      <CardContent className="text-sm text-muted-foreground relative z-10">
        {children}
        <br />
        <span className="text-xs text-gray-500 break-all">{url}</span>
      </CardContent>
    </Card>
  );
});

export default function AcademicsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 grid gap-8">
      <div>
        <h1 className="text-3xl">Academics</h1>
        <p className="text-muted-foreground">Quick links to academic systems and resources.</p>
      </div>

      <div className="space-y-2" id={slugify("Student Lifecycle Management")}>
        <h2 className="text-xl">Student Lifecycle Management</h2>
        <div className="[column-fill:_balance]_columns-1 sm:columns-2 gap-4">
          <AcademicCard title="SLCM 2.0" url="https://maheslcmtech.manipal.edu">
            New SLCM portal
          </AcademicCard>
          <AcademicCard title="SLCM (Classic)" url="https://slcm.manipal.edu">
            Legacy SLCM portal
          </AcademicCard>
        </div>
      </div>

      <div className="space-y-2" id={slugify("Library")}>
        <h2 className="text-xl">Library</h2>
        <div className="[column-fill:_balance]_columns-1 sm:columns-2 gap-4">
          <AcademicCard
            title="Previous Years' Questions Archive"
            url="https://library-orpin-two.vercel.app"
          >
            Browse past question papers
          </AcademicCard>
          <AcademicCard
            title="Manipal OSF"
            url="https://learnermanipal.sharepoint.com/sites/ManipalOSF"
          >
            Student led initiative to compile and share past question papers
          </AcademicCard>
          <AcademicCard title="EBSCO search" url="https://research.ebsco.com/c/fqdtcf/search">
            <span className="text-xs">
              User ID: <span className="font-mono">ebscopreviewmity</span>
            </span>
            <br />
            <span className="text-xs">
              Password: <span className="font-mono">UIPreview2021!</span>
            </span>
            <br />
            Search academic databases
          </AcademicCard>
          <AcademicCard title="Library Portal" url="https://libportal.manipal.edu/MIT/MIT.aspx">
            MIT Library portal
          </AcademicCard>
        </div>
      </div>

      <div className="space-y-2" id={slugify("Academic Resources")}>
        <h2 className="text-xl">Academic Resources</h2>
        <div className="[column-fill:_balance]_columns-1 sm:columns-2 gap-4">
          <AcademicCard title="Lighthouse" url="https://lighthouse.manipal.edu">
            Semester-wise resources and quiz platform
          </AcademicCard>
          <AcademicCard
            title="Pulse (Android)"
            url="https://play.google.com/store/apps/details?id=com.d2l.brightspace.student.android"
          >
            Brightspace Pulse app for Lighthouse
          </AcademicCard>
          <AcademicCard
            title="Pulse (iOS)"
            url="https://apps.apple.com/us/app/brightspace-pulse/id1001688546"
          >
            Brightspace Pulse app for Lighthouse
          </AcademicCard>
          <AcademicCard title="Impartus" url="https://impartus.manipal.edu">
            Class recordings platform
            <br />
            <span className="text-xs relative z-20">
              Alt:{" "}
              <a
                href="https://a.impartus.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                a.impartus.com
              </a>
            </span>
          </AcademicCard>
        </div>
      </div>

      <div className="space-y-2" id={slugify("Research")}>
        <h2 className="text-xl">Research</h2>
        <div className="[column-fill:_balance]_columns-1 sm:columns-2 gap-4">
          <AcademicCard title="Manipal PURE" url="https://researcher.manipal.edu">
            Researchers directory
          </AcademicCard>
        </div>
      </div>

      <div className="space-y-2" id={slugify("Microsoft 365")}>
        <h2 className="text-xl">Microsoft 365</h2>
        <div className="[column-fill:_balance]_columns-1 sm:columns-2 gap-4">
          <AcademicCard title="Outlook" url="https://outlook.office365.com/mail/">
            Web mail
          </AcademicCard>
          <AcademicCard title="Office 365" url="https://m365.cloud.microsoft/apps/">
            Microsoft 365 apps
          </AcademicCard>
        </div>
      </div>
    </main>
  );
}
