"use client";

import * as React from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import {
  Button,
  IconButton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  PillSelect,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  MenuItemContent,
  PillTabs,
  PillTabsList,
  PillTabsTrigger,
  PillTabsContent,
  SectionCard,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  DashedUploadSlot,
  InteractiveListRow,
  Switch,
  Input,
  Label,
  Checkbox,
  Badge,
  StatusBanner,
} from "@/components/base";
import { ButtonGroup } from "@/components/primitives/button-group";
import { Textarea } from "@/components/primitives/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/primitives/radio-group";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/primitives/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/primitives/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/primitives/tooltip";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardCanvas, CardFooter } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/primitives/avatar";

export default function DesignSystemShowcasePage() {
  const [activeSection, setActiveSection] = React.useState("buttons");
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [neonSwitch, setNeonSwitch] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);
  const [circleChecked, setCircleChecked] = React.useState(true);
  const [neonCheckbox, setNeonCheckbox] = React.useState(true);
  const [radioVal, setRadioVal] = React.useState("opt1");
  const [selectVal, setSelectVal] = React.useState("v1");
  const [copiedSnippet, setCopiedSnippet] = React.useState(null);

  const copySnippet = (name, code) => {
    navigator.clipboard?.writeText(code);
    setCopiedSnippet(name);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-subtle bg-lime-400 text-black flex items-center justify-center ds-type-button">
            DS
          </div>
          <div>
            <h1 className="ds-type-caption-label text-white">
              Labveil Design System
            </h1>
            <p className="ds-type-small text-muted-foreground mt-1">
              Living Component Showcase &amp; 12 Base UI Primitives
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="glass">v2.0 Architecture</Badge>
          <Badge variant="outline">Dev Mode Only</Badge>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-[224px] relative border-b md:border-b-0 md:border-r border-white/10 p-4 shrink-0 bg-card/40 flex flex-col gap-1">
          <Label as="div" className="px-3 py-2">
            12 Base Primitives
          </Label>
          <Button
            variant={activeSection === "buttons" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("buttons")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="cursor-rectangle-selection-01" size="md" />
            <span>Buttons &amp; Actions</span>
          </Button>
          <Button
            variant={activeSection === "forms" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("forms")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="note-edit" size="md" />
            <span>Form Inputs</span>
          </Button>
          <Button
            variant={activeSection === "overlays" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("overlays")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="layers-01" size="md" />
            <span>Overlays &amp; Dialogs</span>
          </Button>
          <Button
            variant={activeSection === "navigation" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("navigation")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="browser" size="md" />
            <span>Navigation &amp; Tabs</span>
          </Button>
          <Button
            variant={activeSection === "cards" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("cards")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="dashboard-square-01" size="md" />
            <span>Cards &amp; Containers</span>
          </Button>
          <Button
            variant={activeSection === "feedback" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("feedback")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="analytics-up" size="md" />
            <span>Feedback &amp; Skeletons</span>
          </Button>
          <Button
            variant={activeSection === "tokens" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("tokens")}
            className="w-full justify-start gap-2"
          >
            <HugeIcon name="paint-board" size="md" />
            <span>Design Tokens</span>
          </Button>
        </aside>

        {/* Showcase Panel Content */}
        <main className="flex-1 p-6 md:p-8 max-w-5xl flex flex-col gap-8">
          {/* 1. Buttons Matrix */}
          {activeSection === "buttons" && (
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="ds-type-feature-title">Button &amp; IconButton Primitives</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  100% token-based .ds-btn-* and .ds-icon-btn-* variants with focus-workspace / focus-chrome.
                </p>
              </div>

              {/* All Official Button Variants */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Official Button Variants (Default vs Disabled)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">primary (.ds-btn-primary)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="primary">Generate</Button>
                      <Button variant="primary" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">cta-lg (.ds-btn-cta-lg)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="cta-lg">Get Started</Button>
                      <Button variant="cta-lg" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">secondary (.ds-btn-secondary)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary">Cancel</Button>
                      <Button variant="secondary" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">tonal (.ds-btn-tonal)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="tonal">Tonal Action</Button>
                      <Button variant="tonal" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">pill (.ds-btn-pill)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="pill">Pill Filter</Button>
                      <Button variant="pill" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">filter-chip (.ds-filter-chip)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="filter-chip">Active Tag</Button>
                      <Button variant="filter-chip" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">outline (.ds-btn-outline)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline">Settings</Button>
                      <Button variant="outline" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">ghost (.ds-btn-ghost)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost">Ghost Row</Button>
                      <Button variant="ghost" disabled>Disabled</Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-comfortable bg-white/5 border border-white/5">
                    <span className="ds-type-small text-white/50 font-mono">link (.ds-btn-link)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="link">Documentation</Button>
                      <Button variant="link" disabled>Disabled</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official IconButton Variants */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Official IconButton Variants (.focus-chrome)</h3>
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-comfortable bg-white/5 border border-white/5">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="ds-type-small text-white/50 font-mono">ghost</span>
                    <div className="flex items-center gap-2">
                      <IconButton aria-label="Settings Ghost">
                        <HugeIcon name="settings-02" />
                      </IconButton>
                      <IconButton aria-label="Settings Disabled" disabled>
                        <HugeIcon name="settings-02" />
                      </IconButton>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <span className="ds-type-small text-white/50 font-mono">tonal</span>
                    <div className="flex items-center gap-2">
                      <IconButton variant="tonal" aria-label="Add Media">
                        <HugeIcon name="add-01" />
                      </IconButton>
                      <IconButton variant="tonal" aria-label="Add Disabled" disabled>
                        <HugeIcon name="add-01" />
                      </IconButton>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <span className="ds-type-small text-white/50 font-mono">outline</span>
                    <div className="flex items-center gap-2">
                      <IconButton variant="outline" aria-label="Filter Outline">
                        <HugeIcon name="sliders-horizontal" />
                      </IconButton>
                      <IconButton variant="outline" aria-label="Filter Disabled" disabled>
                        <HugeIcon name="sliders-horizontal" />
                      </IconButton>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <span className="ds-type-small text-white/50 font-mono">carousel</span>
                    <div className="flex items-center gap-2">
                      <IconButton variant="carousel" aria-label="Prev">
                        <HugeIcon name="arrow-left-01" />
                      </IconButton>
                      <IconButton variant="carousel" aria-label="Next Disabled" disabled>
                        <HugeIcon name="arrow-right-01" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segmented ButtonGroup */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Segmented ButtonGroup</h3>
                <ButtonGroup>
                  <Button variant="ghost" className="size-8 p-0" aria-label="Thumb Up">
                    <HugeIcon name="thumbs-up" />
                  </Button>
                  <Button variant="ghost" className="size-8 p-0" aria-label="Share">
                    <HugeIcon name="share-08" />
                  </Button>
                  <Button variant="ghost" className="size-8 p-0" aria-label="More">
                    <HugeIcon name="more-vertical" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          )}

          {/* 2. Form Inputs */}
          {activeSection === "forms" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="ds-type-feature-title">Form Controls &amp; Inputs</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  Accessible, encapsulated form controls (.ds-input, .ds-switch, .ds-checkbox).
                </p>
              </div>

              {/* Text Input Variants */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Input Variants</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Default Input" placeholder="Enter title..." />
                  <Input variant="search" placeholder="Search prompts (bg-accent/50)..." />
                  <div className="ds-composer-well rounded-comfortable p-2 flex items-center gap-2">
                    <HugeIcon name="sparkles" size="md" className="text-white/50" />
                    <Input variant="ghost" placeholder="Type prompt inside composer well (ghost)..." />
                  </div>
                  <Input label="Disabled State" placeholder="Cannot edit..." disabled />
                </div>
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Auto-Resizing Textarea</h3>
                <Textarea label="Prompt Instruction" placeholder="Describe the scene..." minHeight={100} />
              </div>

              {/* Toggles, Checkboxes & Radios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-comfortable bg-card border border-white/5">
                {/* Switches */}
                <div className="flex flex-col gap-3">
                  <Label as="span">Switches (.ds-switch)</Label>
                  <div className="flex items-center gap-3">
                    <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
                    <span className="ds-type-small">Standard Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch size="sm" checked={neonSwitch} onCheckedChange={setNeonSwitch} />
                    <span className="ds-type-small">Small Switch</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch disabled />
                    <span className="ds-type-small text-white/40">Disabled</span>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col gap-3">
                  <Label as="span">Checkboxes (.ds-checkbox)</Label>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb1" checked={checkboxChecked} onCheckedChange={setCheckboxChecked} />
                    <Label htmlFor="cb1" variant="primary" className="cursor-pointer">Default Box</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb2" variant="circle" checked={circleChecked} onCheckedChange={setCircleChecked} />
                    <Label htmlFor="cb2" variant="primary" className="cursor-pointer">Circle Variant (Media)</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb3" size="lg" checked={neonCheckbox} onCheckedChange={setNeonCheckbox} />
                    <Label htmlFor="cb3" variant="primary" className="cursor-pointer">Large Size</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb4" disabled />
                    <Label htmlFor="cb4" disabled>Disabled</Label>
                  </div>
                </div>

                {/* RadioGroup */}
                <div className="flex flex-col gap-3">
                  <Label as="span">Radio Group</Label>
                  <RadioGroup value={radioVal} onValueChange={setRadioVal}>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="opt1" id="r1" />
                      <Label htmlFor="r1" variant="primary" className="cursor-pointer">Option One</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="opt2" id="r2" />
                      <Label htmlFor="r2" variant="primary" className="cursor-pointer">Option Two</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* 3. Overlays & Dialogs */}
          {activeSection === "overlays" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="ds-type-feature-title">Overlays &amp; Floating Panels</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  Glassmorphic modals, floating dropdowns, and contextual popovers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Select with Pill and Default Trigger */}
                <Select value={selectVal} onValueChange={setSelectVal}>
                  <SelectTrigger variant="pill" className="w-48">
                    <SelectValue placeholder="Pill Select" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="v1">Aspect 16:9</SelectItem>
                    <SelectItem value="v2">Aspect 9:16</SelectItem>
                    <SelectItem value="v3">Square 1:1</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="model1">
                  <SelectTrigger variant="default" className="w-48">
                    <SelectValue placeholder="Model Trigger" />
                  </SelectTrigger>
                  <SelectContent variant="listbox">
                    <SelectItem value="model1">Cinematic v2</SelectItem>
                    <SelectItem value="model2">Photoreal v3</SelectItem>
                  </SelectContent>
                </Select>

                {/* Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary">Open Glass Dialog</Button>
                  </DialogTrigger>
                  <DialogContent variant="glass">
                    <DialogHeader>
                      <DialogTitle>Confirm Action</DialogTitle>
                      <DialogDescription>
                        This is a canonical frosted dark glass dialog with 100px backdrop blur.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button variant="primary">Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Dropdown Menu (Canonical Unified Glass) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">Dropdown Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <MenuItemContent icon="pencil-edit-02">Rename</MenuItemContent>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MenuItemContent icon="copy-01">Duplicate</MenuItemContent>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <MenuItemContent icon="delete-02">Move to Trash</MenuItemContent>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Filter Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col gap-2">
                      <span className="ds-type-caption-label">Filter Generations</span>
                      <p className="ds-type-small text-muted-foreground">Adjust display settings.</p>
                      <Button variant="primary" size="sm" className="mt-2">Apply</Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton variant="ghost" aria-label="Help">
                      <HugeIcon name="help-circle" />
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent>Detailed instructions</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {/* 4. Navigation & Tabs */}
          {activeSection === "navigation" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="ds-type-feature-title">Tabs &amp; Segmented Navigation</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  Canonical tab treatments: Pill Tabs (.ds-tab-pill) and Studio Composer Tabs (.ds-composer-tab).
                </p>
              </div>

              {/* Segmented Pill Tabs */}
              <div className="flex flex-col gap-2">
                <Label as="span">Segmented Pills (.ds-tab-pill)</Label>
                <PillTabs defaultValue="all">
                  <PillTabsList variant="segmented">
                    <PillTabsTrigger value="all" variant="pill">All Media</PillTabsTrigger>
                    <PillTabsTrigger value="images" variant="pill">Images</PillTabsTrigger>
                    <PillTabsTrigger value="videos" variant="pill">Videos</PillTabsTrigger>
                  </PillTabsList>
                  <PillTabsContent value="all" className="p-3 ds-type-small text-muted-foreground">
                    All generation assets displayed.
                  </PillTabsContent>
                </PillTabs>
              </div>

              {/* Composer Studio Tabs */}
              <div className="flex flex-col gap-2">
                <Label as="span">Composer Studio Tabs (.ds-composer-tab)</Label>
                <PillTabs defaultValue="prompt">
                  <PillTabsList>
                    <PillTabsTrigger value="prompt" variant="composer">Prompt</PillTabsTrigger>
                    <PillTabsTrigger value="traits" variant="composer">Traits</PillTabsTrigger>
                    <PillTabsTrigger value="camera" variant="composer">Camera</PillTabsTrigger>
                  </PillTabsList>
                  <PillTabsContent value="prompt" className="p-3 ds-type-small text-muted-foreground">
                    Studio prompt panel options.
                  </PillTabsContent>
                </PillTabs>
              </div>
            </div>
          )}

          {/* 5. Cards & Containers */}
          {activeSection === "cards" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="ds-type-feature-title">Cards, Accordions &amp; Media Slots</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  SectionCard (.ds-section-card, .ds-composer-card, .ds-media-card), DashedUploadSlot &amp; InteractiveListRow.
                </p>
              </div>

              {/* SectionCard Variants */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">SectionCard Variants</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SectionCard variant="frosted">
                    <span className="ds-type-caption-label text-white">Frosted SectionCard</span>
                    <p className="ds-type-small text-muted-foreground mt-1">.ds-section-card with blur(40px)</p>
                  </SectionCard>

                  <SectionCard variant="composer">
                    <span className="ds-type-caption-label text-white">Composer SectionCard</span>
                    <p className="ds-type-small text-muted-foreground mt-1">.ds-composer-card prompt well</p>
                  </SectionCard>

                  <SectionCard variant="media">
                    <span className="ds-type-caption-label text-white">Media SectionCard</span>
                    <p className="ds-type-small text-muted-foreground mt-1">.ds-media-card preview tile</p>
                  </SectionCard>
                </div>
              </div>

              {/* Accordion Primitive */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Accordion Trigger (.ds-accordion-trigger)</h3>
                <Accordion type="single" collapsible defaultValue="acc-1" className="w-full">
                  <AccordionItem value="acc-1">
                    <AccordionTrigger>Generation Settings</AccordionTrigger>
                    <AccordionContent>Aspect ratio, seed, and guidance scale configurations.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* DashedUploadSlot Sizes & States */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">DashedUploadSlot (.ds-upload-slot)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <DashedUploadSlot size="square">
                    <input type="file" className="hidden" aria-hidden="true" />
                    <HugeIcon name="add-01" size="lg" />
                    <span className="ds-type-micro-tag">Square</span>
                  </DashedUploadSlot>
                  <DashedUploadSlot size="aspect">
                    <HugeIcon name="cloud-upload" size="lg" />
                    <span className="ds-type-micro-tag">96x72 Aspect</span>
                  </DashedUploadSlot>
                  <DashedUploadSlot size="aspect" disabled>
                    <HugeIcon name="lock-password" size="lg" className="text-white/30" />
                    <span className="ds-type-micro-tag text-white/30">Disabled</span>
                  </DashedUploadSlot>
                </div>
              </div>

              {/* InteractiveListRow Variants */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">InteractiveListRow (.ds-list-row)</h3>
                <div className="flex flex-col gap-2">
                  <InteractiveListRow variant="compact">
                    <span className="ds-type-small">Aspect Ratio 16:9</span>
                    <span className="ds-type-small text-white/50">Default</span>
                  </InteractiveListRow>
                  <InteractiveListRow variant="thumbnail">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-subtle bg-white/10 flex items-center justify-center">
                        <HugeIcon name="image-02" size="md" />
                      </div>
                      <div className="flex flex-col">
                        <span className="ds-type-small">Cyberpunk Hero Avatar</span>
                        <span className="ds-type-micro-tag text-white/50">Thumbnail preview item</span>
                      </div>
                    </div>
                    <Badge variant="glass">Active</Badge>
                  </InteractiveListRow>
                </div>
              </div>
            </div>
          )}

          {/* 6. Feedback & Badges */}
          {activeSection === "feedback" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="ds-type-feature-title">Feedback, Badges &amp; Status Banners</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  Badges (.ds-badge, .ds-badge-glass, .ds-badge-count) and StatusBanner (.ds-banner-accent).
                </p>
              </div>

              {/* StatusBanner */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">StatusBanner (.ds-banner-accent)</h3>
                <StatusBanner>
                  <div className="flex items-center gap-2">
                    <HugeIcon name="flash" className="text-amber-400" />
                    <span className="ds-type-small">Generation queue is running at high speed</span>
                  </div>
                  <Button variant="outline" size="sm">View Tasks</Button>
                </StatusBanner>
              </div>

              {/* Badges Matrix */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Badge Variants</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="default">Default (.ds-badge)</Badge>
                  <Badge variant="glass">Glass (.ds-badge-glass)</Badge>
                  <div className="flex items-center gap-2">
                    <span className="ds-type-small text-white/50">Count:</span>
                    <Badge variant="count">4</Badge>
                  </div>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="neon">Neon Pro</Badge>
                  <Badge variant="success">Completed</Badge>
                  <Badge variant="warning">In Progress</Badge>
                  <Badge variant="danger">Failed</Badge>
                  <Badge variant="outline">Draft</Badge>
                </div>
              </div>

              {/* Skeletons */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Shimmer Skeletons</h3>
                <div className="flex flex-col gap-2 max-w-sm">
                  <Skeleton variant="shimmer" className="h-4 w-3/4" />
                  <Skeleton variant="shimmer" className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          )}

          {/* 7. Design Tokens */}
          {activeSection === "tokens" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="ds-type-feature-title">Design Tokens Hierarchy</h2>
                <p className="ds-type-small text-muted-foreground mt-1">
                  Canonical single source of truth for surfaces, radiuses, and semantic accents.
                </p>
              </div>

              {/* Surface Palette */}
              <div className="flex flex-col gap-3">
                <h3 className="ds-type-caption-label text-white/90">Surface Ladder (Dark First)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-comfortable bg-omni-bg border border-white/10">
                    <span className="ds-type-caption-label block">Omni Root</span>
                    <span className="ds-type-small text-muted-foreground">--omni-bg</span>
                  </div>
                  <div className="p-3 rounded-comfortable bg-body-root border border-white/10">
                    <span className="ds-type-caption-label block">Body Root</span>
                    <span className="ds-type-small text-muted-foreground">--body-bg</span>
                  </div>
                  <div className="p-3 rounded-comfortable bg-canvas-deep border border-white/10">
                    <span className="ds-type-caption-label block">Canvas Deep</span>
                    <span className="ds-type-small text-muted-foreground">--canvas-bg</span>
                  </div>
                  <div className="p-3 rounded-comfortable surface-glass">
                    <span className="ds-type-caption-label block">Glass</span>
                    <span className="ds-type-small text-muted-foreground">surface-glass</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
