-- CreateTable
CREATE TABLE "university_options" (
    "id" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "programArea" TEXT NOT NULL DEFAULT 'STEM',
    "stemFocus" TEXT[],
    "exchangeDurationMonths" INTEGER NOT NULL DEFAULT 6,
    "websiteUrl" TEXT NOT NULL DEFAULT '',
    "departmentUrl" TEXT NOT NULL DEFAULT '',
    "languageOfInstruction" TEXT[],
    "localLanguage" TEXT[],
    "cityType" TEXT NOT NULL DEFAULT 'medium',
    "estimatedMonthlyCost" JSONB NOT NULL DEFAULT '{}',
    "housingOptions" JSONB NOT NULL DEFAULT '[]',
    "academicProfile" JSONB NOT NULL DEFAULT '{}',
    "lifeProfile" JSONB NOT NULL DEFAULT '{}',
    "userPreferencesFit" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'interested',
    "priorityTag" TEXT NOT NULL DEFAULT 'B',
    "pros" TEXT[],
    "cons" TEXT[],
    "redFlags" TEXT[],
    "personalNotes" TEXT NOT NULL DEFAULT '',
    "links" JSONB NOT NULL DEFAULT '[]',
    "deadlines" JSONB NOT NULL DEFAULT '[]',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scholarshipAmountMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "housingAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partTimeIncomeMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_scenarios_pkey" PRIMARY KEY ("id")
);
