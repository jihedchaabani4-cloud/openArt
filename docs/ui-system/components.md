# Reusable Component APIs (`components.md`)

> Canonical component reference for all primitives located in `@/shared/ui/*`.  
> Follow the **Zero Call-Site Restyling Law**: callers specify only `variant` and `size`. `className` is reserved exclusively for layout positioning.

---

## 1. Action Components

### `<Button />` (`@/shared/ui/button`)
- **Imports**: `import { Button, buttonVariants } from "@/shared/ui/button";`
- **Variants**:
  - `white` / `primary`: High-contrast pure white (#fff) on black canvas.
  - `secondary`: Dark elevated surface container (#282a2c).
  - `outline`: Subtle bordered ghost (`border-white/10`).
  - `ghost`: Transparent with subtle hover state.
  - `danger`: Red ghost text & icon (#fe6e6e) for delete triggers.
  - `destructive-filled`: Solid crimson container for permanent modal delete confirmations.
  - `neon`: Electric lime (#EFFE17) Cinema Studio hero action.
  - `pill` / `pill-active`: Rounded-full filter chips.
- **Sizes**:
  - `default`: `h-8 px-3.5 text-xs` (Universal default).
  - `sm`: `h-8 px-3 text-xs` (Compact panels).
  - `xs`: `h-6 px-2 text-xs` (Micro chips).
  - `lg`: `h-10 px-6 text-sm` (Hero forms).
  - `icon`: `size-9 p-0` (36×36px standalone icon).
  - `icon-sm`: `size-8 p-0` (32×32px toolbar icon).
  - `icon-xs`: `size-6 p-0` (24×24px micro icon).
- **Example**:
  ```jsx
  <Button variant="white" size="default">Generate</Button>
  <Button variant="ghost" size="icon" aria-label="Settings"><GoogleIcon iconName="settings" /></Button>
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

### `<Card />` (`@/shared/ui/card`)
- **Imports**: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/card";`
- **Variants**: `default`, `interactive` (hover-elevated), `glass`.
- **Example**:
  ```jsx
  <Card variant="interactive">
    <CardHeader>
      <CardTitle>Project Alpha</CardTitle>
      <CardDescription>Created 2 hours ago</CardDescription>
    </CardHeader>
    <CardContent>Body preview...</CardContent>
    <CardFooter><Button variant="white" size="xs">Open</Button></CardFooter>
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
- **Shapes**: `default` (rounded-button), `card` (rounded-card), `circle` (rounded-full), `badge` (rounded-badge).
- **Example**:
  ```jsx
  <Skeleton variant="shimmer" className="h-4 w-3/4" />
  <Skeleton shape="circle" className="size-10" />
  ```
