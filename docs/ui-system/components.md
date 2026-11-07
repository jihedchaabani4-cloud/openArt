# Reusable Component APIs (`components.md`)

> Canonical component reference for all primitives located in `@/shared/ui/*`.  
> Follow the **Zero Call-Site Restyling Law**: callers specify only `variant` and `size`. `className` is reserved exclusively for layout positioning.

---

## 1. Action Components

### `<Button />` (`@/shared/ui/button`)
- **Imports**: `import { Button, buttonVariants } from "@/shared/ui/button";`
- **Variants** (6 Core Semantic Variants):
  - `primary`: High-contrast pure white (`#fff`) on dark canvas (`rounded-sm` 4px default).
  - `secondary`: Dark elevated surface container (`--foreground-state-05` / `#282a2c`).
  - `outline`: Subtle bordered action button (`border-(--mat-sys-outline-variant)`).
  - `ghost`: Transparent with subtle hover state (default variant).
  - `danger`: Semantic danger/destructive red (`#fe6e6e`) for delete actions.
  - `link`: Inline text action button with underline.
- **Sizing & Geometry**:
  - Default height is `h-8 px-3.5 text-xs` (`32px`, `rounded-sm` `4px`).
  - Customize sizes or pill shapes via `className` (`h-10 px-6 text-sm`, `size-8 p-0`, `rounded-full`).
- **Example**:
  ```jsx
  <Button variant="primary">Generate</Button>
  <Button variant="ghost" className="size-8 p-0" aria-label="Settings"><GoogleIcon iconName="settings" /></Button>
  ```

### `<ButtonGroup />` (`@/shared/ui/button-group`)
- **Imports**: `import { ButtonGroup } from "@/shared/ui/button-group";`
- **Example**:
  ```jsx
  <ButtonGroup>
    <Button variant="ghost" size="icon-sm"><GoogleIcon iconName="thumb_up" /></Button>
    <Button variant="ghost" size="icon-sm"><GoogleIcon iconName="share" /></Button>
  </ButtonGroup>
  ```

---

## 2. Form & Input Controls

### `<Input />` (`@/shared/ui/input`)
- **Imports**: `import { Input } from "@/shared/ui/input";`
- **Variants**: `default`, `search` (with icon & clear button), `blurinput` (navbar renaming).
- **Props**: `label`, `googleIcon`, `prefix`, `onClear`, `rightElement`.
- **Example**:
  ```jsx
  <Input label="Asset Title" placeholder="Enter title" />
  <Input variant="search" placeholder="Search..." googleIcon="search" />
  ```

### `<Textarea />` (`@/shared/ui/textarea`)
- **Imports**: `import { Textarea } from "@/shared/ui/textarea";`
- **Variants**: `default`, `blur`.
- **Props**: `minHeight`, `maxHeight`, `label`, `hint`.
- **Example**:
  ```jsx
  <Textarea label="Prompt Instruction" placeholder="Describe your image..." minHeight={120} />
  ```

### `<Switch />` (`@/shared/ui/switch`)
- **Imports**: `import { Switch } from "@/shared/ui/switch";`
- **Variants**: `default`, `neon`, `primary`.
- **Sizes**: `default` (h-6 w-11), `sm` (h-5 w-9).
- **Example**:
  ```jsx
  <Switch checked={enabled} onCheckedChange={setEnabled} />
  <Switch variant="neon" size="sm" checked={autoEnhance} onCheckedChange={setAutoEnhance} />
  ```

### `<Checkbox />` (`@/shared/ui/checkbox`)
- **Imports**: `import { Checkbox } from "@/shared/ui/checkbox";`
- **Variants**: `default`, `neon`.
- **Sizes**: `default` (size-4), `lg` (size-5).
- **Example**:
  ```jsx
  <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
  <Checkbox variant="neon" size="lg" checked={autoUpscale} onCheckedChange={setAutoUpscale} />
  ```

### `<RadioGroup />` (`@/shared/ui/radio-group`)
- **Imports**: `import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";`
- **Variants**: `default`, `neon`.
- **Example**:
  ```jsx
  <RadioGroup value={mode} onValueChange={setMode}>
    <RadioGroupItem value="standard" id="r1" />
    <RadioGroupItem value="high" id="r2" variant="neon" />
  </RadioGroup>
  ```

---

## 3. Overlays & Floating Panels

### `<Dialog />` (`@/shared/ui/dialog`)
- **Imports**: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/shared/ui/dialog";`
- **Variants**: `default`, `glass` (frosted cinema-grade dark glass overlay), `full`.
- **Example**:
  ```jsx
  <Dialog>
    <DialogTrigger asChild><Button variant="white">Open</Button></DialogTrigger>
    <DialogContent variant="glass">
      <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
      <DialogFooter><Button variant="white">Proceed</Button></DialogFooter>
    </DialogContent>
  </Dialog>
  ```

### `<DropdownMenu />` (`@/shared/ui/dropdown-menu`)
- **Imports**: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/shared/ui/dropdown-menu";`
- **Item Variants**: `default`, `destructive`.
- **Example**:
  ```jsx
  <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><GoogleIcon iconName="more_vert" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onClick={handleDelete}>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  ```

### `<Popover />` (`@/shared/ui/popover`)
- **Imports**: `import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";`
- **Example**:
  ```jsx
  <Popover>
    <PopoverTrigger asChild><Button variant="outline">Filters</Button></PopoverTrigger>
    <PopoverContent>Filter parameters...</PopoverContent>
  </Popover>
  ```

### `<Tooltip />` (`@/shared/ui/tooltip`)
- **Imports**: `import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";`
- **Example**:
  ```jsx
  <Tooltip>
    <TooltipTrigger asChild><Button variant="ghost" size="icon"><GoogleIcon iconName="info" /></Button></TooltipTrigger>
    <TooltipContent>More details on this feature</TooltipContent>
  </Tooltip>
  ```

---

## 4. Navigation & Containers

### `<Tabs />` (`@/shared/ui/tabs`)
- **Imports**: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";`
- **Variants**: `pills` (default segmented rounded-full), `underline`, `studio` (uppercase Cinema Studio tracking).
- **Example**:
  ```jsx
  <Tabs defaultValue="all">
    <TabsList variant="pills">
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="videos">Videos</TabsTrigger>
    </TabsList>
    <TabsContent value="all">Grid content...</TabsContent>
  </Tabs>
  ```

### `<Surface />` (`@/shared/ui/surface`)
- **Imports**: `import { Surface, surfaceVariants } from "@/shared/ui/surface";`
- **Props**:
  - `tone`: `"base"` | `"panel"` | `"processing"` | `"card"` | `"elevated"` | `"highest"` | `"sunken"` | `"overlay"`
  - `radius`: `"none"` | `"xxxs"` | `"xs"` | `"sm"` | `"md"` | `"full"`
  - `asChild`: `boolean` (delegates rendering to child via `Slot.Root` from `radix-ui`)
- **Example**:
  ```jsx
  <Surface tone="panel" radius="md" className="p-4">
    Panel content...
  </Surface>
  ```

### `<Card />` (`@/shared/ui/card`)
- **Imports**:
  - Compound / Dot-notation: `import { Card } from "@/shared/ui/card";`
  - Named exports: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardCanvas, CardFooter } from "@/shared/ui/card";`
- **Variants & Props**:
  - `variant`: `"default"` | `"interactive"` | `"glass"`
  - `tone`: `"card"` | `"base"` | `"elevated"` | `"overlay"` (or any `Surface` tone)
  - `radius`: `"none"` | `"xxxs"` (media 1px) | `"xs"` | `"sm"` | `"md"` (container 6px) | `"full"`
  - `interactive`: `boolean` (enables hover, active scale, and WCAG keyboard focus)
- **Subcomponents**:
  - `Card.Header` (`CardHeader`): Flex column title container with optional `bordered` prop.
  - `Card.Title` (`CardTitle`): Semantic `<h3>` typography element.
  - `Card.Description` (`CardDescription`): Muted subtitle paragraph.
  - `Card.Canvas` (`CardCanvas`): Edge-to-edge zero-padding viewport for video, canvas, or WebGL previews.
  - `Card.Body` / `Card.Content` (`CardContent`): Primary padded content area.
  - `Card.Footer` (`CardFooter`): Padded action row with optional `bordered` prop.
- **Example**:
  ```jsx
  <Card variant="interactive">
    <Card.Canvas className="aspect-video">
      <video src="..." className="w-full h-full object-cover" />
    </Card.Canvas>
    <Card.Header bordered>
      <Card.Title>Cinema Generation</Card.Title>
      <Card.Description>Generated with Cinema Studio</Card.Description>
    </Card.Header>
    <Card.Body>Prompt details...</Card.Body>
    <Card.Footer bordered>
      <Button variant="primary" size="xs">Export</Button>
    </Card.Footer>
  </Card>
  ```

---

## 5. Feedback & Skeletons

### `<Badge />` (`@/shared/ui/badge`)
- **Imports**: `import { Badge } from "@/shared/ui/badge";`
- **Variants**: `default`, `secondary`, `neon`, `success`, `danger`, `warning`, `outline`.
- **Sizes**: `default` (h-5 text-xs), `sm` (h-4 text-xs).
- **Example**:
  ```jsx
  <Badge variant="neon">Pro</Badge>
  <Badge variant="success">Completed</Badge>
  ```

### `<Skeleton />` (`@/shared/ui/skeleton`)
- **Imports**: `import { Skeleton } from "@/shared/ui/skeleton";`
- **Variants**: `pulse` (default opacity pulse), `shimmer` (gradient sweep).
- **Shapes**: `default` (`rounded-sm`), `card` (`rounded-md`), `circle` (`rounded-full`), `badge` (`rounded-sm`).
- **Example**:
  ```jsx
  <Skeleton variant="shimmer" className="h-4 w-3/4" />
  <Skeleton shape="circle" className="size-10" />
  ```

---

## 6. Layout Primitives (`@/shared/ui/layout`)

### `<Container />`, `<Section />`, `<Stack />`, `<Inline />`
- **Imports**: `import { Container, Section, Stack, Inline } from "@/shared/ui/layout";`
- **Container Tiers**: `size="cinema" | "editorial" | "compact" | "full"` (maps to `.container-cinema` 1600px, `.container-editorial` 1280px, `.container-compact` 980px, or `w-full`).
- **Spacing Scale (`gap` / `spacing`)**: `none`, `xxs` (4px), `xs` (6px), `sm` (8px), `md` (12px), `base` (16px), `lg` (20px), `xl` (24px), `xxl` (28px), `section` (32px), `section-lg` (48px), `section-xl` (64px), `section-xxl` (78px).
- **Example**:
  ```jsx
  <Section spacing="section-lg">
    <Container size="editorial">
      <Stack gap="lg">
        <Inline gap="sm" align="center" justify="between">
          <h2>Studio Overview</h2>
          <Button variant="primary">Create</Button>
        </Inline>
      </Stack>
    </Container>
  </Section>
  ```

