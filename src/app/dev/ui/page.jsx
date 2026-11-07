"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { ButtonGroup } from "@/shared/ui/button-group";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Switch } from "@/shared/ui/switch";
import { Checkbox } from "@/shared/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/shared/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/shared/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Container, Section, Stack, Inline } from "@/shared/ui/layout";

export default function DesignSystemShowcasePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const [activeSection, setActiveSection] = React.useState("buttons");
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [neonSwitch, setNeonSwitch] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);
  const [neonCheckbox, setNeonCheckbox] = React.useState(true);
  const [radioVal, setRadioVal] = React.useState("opt1");
  const [copiedSnippet, setCopiedSnippet] = React.useState(null);

  const copySnippet = (name, code) => {
    navigator.clipboard?.writeText(code);
    setCopiedSnippet(name);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-sm bg-lime-400 text-black flex items-center justify-center font-bold text-sm">
            DS
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">
              Labveil Design System
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Living Component Showcase & Visual Token Reference
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neon">v2.0 Architecture</Badge>
          <Badge variant="outline">Dev Mode Only</Badge>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-4 shrink-0 bg-card/40 flex flex-col gap-1">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
            Components & Tokens
          </div>
          <Button
            variant={activeSection === "tokens" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("tokens")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="palette" className="text-base" />
            <span>Design Tokens</span>
          </Button>
          <Button
            variant={activeSection === "buttons" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("buttons")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="smart_button" className="text-base" />
            <span>Buttons & Actions</span>
          </Button>
          <Button
            variant={activeSection === "forms" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("forms")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="edit_note" className="text-base" />
            <span>Form Inputs</span>
          </Button>
          <Button
            variant={activeSection === "overlays" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("overlays")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="layers" className="text-base" />
            <span>Overlays & Dialogs</span>
          </Button>
          <Button
            variant={activeSection === "navigation" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("navigation")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="tab" className="text-base" />
            <span>Navigation & Tabs</span>
          </Button>
          <Button
            variant={activeSection === "cards" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("cards")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="dashboard" className="text-base" />
            <span>Cards & Containers</span>
          </Button>
          <Button
            variant={activeSection === "feedback" ? "secondary" : "ghost"}
            onClick={() => setActiveSection("feedback")}
            className="w-full justify-start gap-2"
          >
            <GoogleIcon iconName="insights" className="text-base" />
            <span>Feedback & Skeletons</span>
          </Button>
        </aside>

        {/* Showcase Panel Content */}
        <main className="flex-1 p-6 md:p-8 max-w-5xl flex flex-col gap-8">
          {/* 1. Design Tokens */}
          {activeSection === "tokens" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold">Design Tokens Hierarchy</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Canonical single source of truth for surfaces, radiuses, and semantic accents.
                </p>
              </div>

              {/* Surface Palette */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Surface Ladder (Dark First)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-md bg-black border border-white/10 flex flex-col gap-1">
                    <span className="text-xs font-semibold">Canvas</span>
                    <span className="text-xs text-muted-foreground">bg-black</span>
                  </div>
                  <div className="p-4 rounded-md bg-neutral-900 border border-white/10 flex flex-col gap-1">
                    <span className="text-xs font-semibold">Panel</span>
                    <span className="text-xs text-muted-foreground">bg-surface-panel</span>
                  </div>
                  <div className="p-4 rounded-md bg-card border border-white/10 flex flex-col gap-1">
                    <span className="text-xs font-semibold">Card</span>
                    <span className="text-xs text-muted-foreground">bg-card</span>
                  </div>
                  <div className="p-4 rounded-md bg-surface-elevated border border-white/10 flex flex-col gap-1">
                    <span className="text-xs font-semibold">Elevated</span>
                    <span className="text-xs text-muted-foreground">bg-surface-elevated</span>
                  </div>
                  <div className="p-4 rounded-md bg-white/5 border border-white/10 backdrop-blur-md flex flex-col gap-1">
                    <span className="text-xs font-semibold">Glass</span>
                    <span className="text-xs text-muted-foreground">backdrop-blur-md</span>
                  </div>
                </div>
              </div>

              {/* Border Radius Hierarchy */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Strict Runway Border Radius Tokens (Max md / 6px)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-none flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold">None</span>
                    <span className="text-xs text-muted-foreground">0px (rounded-none)</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xxxs flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold">Media</span>
                    <span className="text-xs text-muted-foreground">1px (rounded-xxxs)</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold">Sharp</span>
                    <span className="text-xs text-muted-foreground">4px (rounded-sm)</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-md flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold">Subtle (MAX)</span>
                    <span className="text-xs text-muted-foreground">6px (rounded-md)</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-full flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold">Full</span>
                    <span className="text-xs text-muted-foreground">9999px (rounded-full)</span>
                  </div>
                </div>
              </div>

              {/* Runway Spacing Scale */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Runway 8px Spacing Scale</h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">xxs: 4px</span>
                    <span className="text-xs text-muted-foreground">p-xxs / gap-xxs</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">xs: 6px</span>
                    <span className="text-xs text-muted-foreground">p-xs / gap-xs</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">sm: 8px</span>
                    <span className="text-xs text-muted-foreground">p-sm / gap-sm</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">md: 12px</span>
                    <span className="text-xs text-muted-foreground">p-md / gap-md</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">base: 16px</span>
                    <span className="text-xs text-muted-foreground">p-base / gap-base</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">lg: 20px</span>
                    <span className="text-xs text-muted-foreground">p-lg / gap-lg</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">xl: 24px</span>
                    <span className="text-xs text-muted-foreground">p-xl / gap-xl</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">xxl: 28px</span>
                    <span className="text-xs text-muted-foreground">p-xxl / gap-xxl</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">section: 32px</span>
                    <span className="text-xs text-muted-foreground">py-section</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">sec-lg: 48px</span>
                    <span className="text-xs text-muted-foreground">py-section-lg</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">sec-xl: 64px</span>
                    <span className="text-xs text-muted-foreground">py-section-xl</span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-center">
                    <span className="text-xs font-semibold block">sec-xxl: 78px</span>
                    <span className="text-xs text-muted-foreground">py-section-xxl</span>
                  </div>
                </div>
              </div>

              {/* Brand Accents */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Semantic & Brand Accents</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neon">Cinema Neon</Badge>
                  <Badge variant="success">Upload Success</Badge>
                  <Badge variant="warning">Quota Warning</Badge>
                  <Badge variant="danger">Destructive Error</Badge>
                  <Badge variant="secondary">Google Blue</Badge>
                </div>
              </div>
            </div>
          )}

          {/* 2. Buttons Matrix */}
          {activeSection === "buttons" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Button Primitive</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Canonical 6 Core Semantic Variants (primary, secondary, outline, ghost, danger, link) + Tailwind Utilities.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => copySnippet("btn", '<Button variant="primary">Generate</Button>')}
                >
                  <GoogleIcon iconName="content_copy" className="text-xs" />
                  <span>{copiedSnippet === "btn" ? "Copied!" : "Copy JSX"}</span>
                </Button>
              </div>

              {/* Variants Grid */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">6 Core Semantic Variants</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">primary</Button>
                  <Button variant="secondary">secondary</Button>
                  <Button variant="outline">outline</Button>
                  <Button variant="ghost">ghost (default)</Button>
                  <Button variant="danger">danger</Button>
                  <Button variant="link">link</Button>
                </div>
              </div>

              {/* Specialized Styling via className */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Custom Styling via className (No Extra Props)</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" className="h-10 px-5 bg-brand-neon text-black text-sm font-semibold hover:opacity-80">Neon CTA</Button>
                  <Button variant="ghost" className="rounded-full px-4 bg-white/10 hover:bg-white/15 text-white/60 hover:text-white">Resting Pill</Button>
                  <Button variant="primary" className="rounded-full px-4">Active Pill</Button>
                  <Button variant="danger" className="bg-red-900 text-red-100 hover:bg-red-800 border border-red-500/20">Destructive Filled</Button>
                </div>
              </div>

              {/* Sizes Grid */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Canonical Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" className="h-10 px-6 text-sm">Large (h-10)</Button>
                  <Button variant="secondary">Default (h-8)</Button>
                  <Button variant="secondary">Small (h-8)</Button>
                  <Button variant="secondary" className="h-6 px-2 text-xs">Micro (h-6)</Button>
                  <Button variant="secondary" className="size-9 p-0" aria-label="Icon">
                    <GoogleIcon iconName="settings" />
                  </Button>
                  <Button variant="secondary" className="size-8 p-0" aria-label="Small Icon">
                    <GoogleIcon iconName="edit" />
                  </Button>
                  <Button variant="secondary" className="size-6 p-0 [&_svg]:size-3" aria-label="Micro Icon">
                    <GoogleIcon iconName="close" />
                  </Button>
                </div>
              </div>

              {/* Button Groups */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Segmented ButtonGroup</h3>
                <ButtonGroup>
                  <Button variant="ghost"
                    className="size-8 p-0" aria-label="Thumb Up">
                    <GoogleIcon iconName="thumb_up" />
                  </Button>
                  <Button variant="ghost"
                    className="size-8 p-0" aria-label="Share">
                    <GoogleIcon iconName="share" />
                  </Button>
                  <Button variant="ghost"
                    className="size-8 p-0" aria-label="More">
                    <GoogleIcon iconName="more_vert" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          )}

          {/* 3. Form Inputs */}
          {activeSection === "forms" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold">Form Controls & Inputs</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Accessible, encapsulated form controls with dark theme styling.
                </p>
              </div>

              {/* Text Input Variants */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Text Field & Search</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Asset Title" placeholder="Enter title..." />
                  <Input variant="search" placeholder="Search prompts..." googleIcon="search" />
                </div>
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Auto-Resizing Textarea</h3>
                <Textarea label="Prompt Instruction" placeholder="Describe the scene..." minHeight={100} />
              </div>

              {/* Toggles, Checkboxes & Radios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-md bg-card border border-white/5">
                {/* Switches */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">Switches</span>
                  <div className="flex items-center gap-3">
                    <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
                    <span className="text-xs">Standard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch variant="neon" size="sm" checked={neonSwitch} onCheckedChange={setNeonSwitch} />
                    <span className="text-xs">Neon Small</span>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">Checkboxes</span>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb1" checked={checkboxChecked} onCheckedChange={setCheckboxChecked} />
                    <label htmlFor="cb1" className="text-xs cursor-pointer">Default</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cb2" variant="neon" size="lg" checked={neonCheckbox} onCheckedChange={setNeonCheckbox} />
                    <label htmlFor="cb2" className="text-xs cursor-pointer">Neon Large</label>
                  </div>
                </div>

                {/* RadioGroup */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">Radio Group</span>
                  <RadioGroup value={radioVal} onValueChange={setRadioVal}>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="opt1" id="r1" />
                      <label htmlFor="r1" className="text-xs cursor-pointer">Option One</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="opt2" id="r2" variant="neon" />
                      <label htmlFor="r2" className="text-xs cursor-pointer">Neon Option</label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* 4. Overlays & Dialogs */}
          {activeSection === "overlays" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold">Overlays & Floating Panels</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Glassmorphic modals, floating dropdowns, and contextual popovers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
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

                {/* Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">Actions Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <GoogleIcon iconName="edit" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <GoogleIcon iconName="content_copy" />
                      <span>Duplicate</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <GoogleIcon iconName="delete" />
                      <span>Move to Trash</span>
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
                      <span className="text-xs font-semibold">Filter Generations</span>
                      <p className="text-xs text-muted-foreground">Adjust display settings.</p>
                      <Button variant="primary" className="h-6 px-2 text-xs mt-2">Apply</Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="size-9 p-0" aria-label="Help">
                      <GoogleIcon iconName="help" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Detailed instructions</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {/* 5. Navigation & Tabs */}
          {activeSection === "navigation" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold">Tabs & Segmented Navigation</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Canonical tab treatments: Pills, Underline, and Cinema Studio.
                </p>
              </div>

              {/* Pills Tabs */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Pills (Default)</span>
                <Tabs defaultValue="all">
                  <TabsList variant="pills">
                    <TabsTrigger value="all">All Media</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="p-3 text-xs text-muted-foreground">
                    All generation assets displayed.
                  </TabsContent>
                </Tabs>
              </div>

              {/* Underline Tabs */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Underline Tabs</span>
                <Tabs defaultValue="overview">
                  <TabsList variant="underline">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="p-3 text-xs text-muted-foreground">
                    Project overview details.
                  </TabsContent>
                </Tabs>
              </div>

              {/* Studio Tabs */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Cinema Studio Tabs</span>
                <Tabs defaultValue="prompt">
                  <TabsList variant="studio">
                    <TabsTrigger value="prompt">Prompt</TabsTrigger>
                    <TabsTrigger value="traits">Traits</TabsTrigger>
                    <TabsTrigger value="camera">Camera</TabsTrigger>
                  </TabsList>
                  <TabsContent value="prompt" className="p-3 text-xs text-muted-foreground">
                    Studio prompt panel options.
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {/* 6. Cards & Containers */}
          {activeSection === "cards" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold">Cards & Surface Containers</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Canonical compound Card system with default, interactive, and glass variants.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Standard Card</CardTitle>
                    <CardDescription>Default surface container</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Content inside standard card.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary" className="h-6 px-2 text-xs">Action</Button>
                  </CardFooter>
                </Card>

                <Card variant="interactive">
                  <CardHeader>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>Hover-elevated with click</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Hover to inspect elevation.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="primary" className="h-6 px-2 text-xs">Open</Button>
                  </CardFooter>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle>Glass Card</CardTitle>
                    <CardDescription>Frosted glass background</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Subtle backdrop blur.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="h-6 px-2 text-xs">Details</Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Layout Primitives Showcase */}
              <Section spacing="none" className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white/90">Layer 3 Layout Primitives (Container, Section, Stack, Inline)</h3>
                <Container size="compact" className="bg-surface-panel p-4 rounded-md border border-white/10">
                  <Stack gap="sm">
                    <span className="text-xs font-semibold text-white">Container (compact) + Stack (sm)</span>
                    <Inline gap="xs" wrap={true}>
                      <Badge variant="default">Stack item 1</Badge>
                      <Badge variant="secondary">Stack item 2</Badge>
                      <Badge variant="neon">Inline flow</Badge>
                    </Inline>
                  </Stack>
                </Container>
              </Section>
            </div>
          )}

          {/* 7. Feedback & Skeletons */}
          {activeSection === "feedback" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold">Feedback, Skeletons & Avatars</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Badges, shimmer skeletons, and avatar primitives.
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
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
                <h3 className="text-sm font-semibold text-white/90">Shimmer & Pulse Skeletons</h3>
                <div className="flex flex-col gap-2 max-w-sm">
                  <Skeleton variant="shimmer" className="h-4 w-3/4" />
                  <Skeleton variant="shimmer" className="h-4 w-1/2" />
                  <div className="flex items-center gap-3 mt-2">
                    <Skeleton shape="circle" className="size-10" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatars */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/90">Avatars</h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-8">
                    <AvatarFallback>OA</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
