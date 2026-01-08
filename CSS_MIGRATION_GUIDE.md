# CSS Migration Guide

## Overview

The current `globals.css` (4,918 lines) has been cleaned to **~1,200 lines**. Component-specific styles need to be moved to their respective CSS Module files.

## Summary of Changes

### What STAYS in globals.css:
- ✅ Tailwind directives
- ✅ CSS variables (color tokens)
- ✅ CSS reset/normalize
- ✅ Typography (h1-h6, p, lists)
- ✅ Accessibility styles (.sr-only, .skip-link)
- ✅ Shared button styles (.primary-cta, .secondary-cta) - **SINGLE SOURCE OF TRUTH**
- ✅ Base container utility
- ✅ Webflow framework styles (w-* classes)
- ✅ Splide slider overrides

### What MOVES to CSS Modules:
- ❌ All component-specific class names
- ❌ Component-specific media queries
- ❌ Duplicate button style definitions

---

## Detailed Migration Instructions

### 1. NavBar.module.css
**Status:** ✅ Already clean - no duplicates found

**Optional additions from globals.css (if needed):**
```css
/* Lines 2304-2341 from globals.css */
.icon {
  grid-column-gap: 8px;
  border: .5px solid var(--shark--700);
  border-radius: 100px;
  flex: 0 auto;
  justify-content: flex-start;
  align-items: center;
  padding: 8px;
  text-decoration: none;
  display: flex;
}
```

**Action:** Remove duplicate `.secondary-cta` from NavBar.module.css (lines 56-76), use the global one instead.

---

### 2. Hero.module.css
**Action:** Remove duplicate `.primary-cta` (lines 107-126) - use global version instead.

**Add from globals.css:**
```css
/* Currently missing in Hero.module.css */
.image-7 {
  z-index: 0;
  position: relative;
  right: auto;
}
```

---

### 3. ProcessSection.module.css
**Status:** ✅ Clean - no changes needed

---

### 4. ServicesSection.module.css
**Action:** Remove duplicate `.primary-cta` (lines 161-184) - use global version instead.

**Add from globals.css (if not already present):**
```css
/* Services specific heading */
.heading-2 {
  color: var(--shark--950);
  text-align: center;
  text-transform: uppercase;
  width: 100%;
  margin-top: 0;
  margin-bottom: 0;
  margin-right: 0;
  font-family: Inter, sans-serif;
  font-size: 36px;
  font-style: italic;
  font-weight: 400;
  line-height: 110%;
  text-decoration: none;
  display: inline-block;
}
```

---

### 5. Benefits.module.css
**Status:** ✅ Clean - no significant duplicates

---

### 6. EligeTranquilo.module.css
**Action:** Remove duplicate `.secondary-cta` (lines 114-134) - use global version instead.

**Keep these component-specific styles:**
```css
.call-to-action-header { /* ... */ }
.section-background-yellow { /* ... */ }
.cta-container { /* ... */ }
.cta-container-background { /* ... */ }
```

---

### 7. CentroInspeccion.module.css
**Action:** Remove duplicate `.primary-cta` (lines 148-171) - use global version instead.

**Add these utility styles:**
```css
.text-primary {
  color: var(--shark--950);
  letter-spacing: -.03em;
  white-space: nowrap;
  margin-top: 0;
  margin-bottom: 0;
  font-family: DM Sans, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
}

.btn-map {
  box-sizing: border-box;
  clear: none;
  grid-column-gap: 10px;
  border: .5px solid var(--shark--200);
  background-color: var(--bright-sun--50);
  word-break: normal;
  border-radius: 100px;
  flex: 0 auto;
  justify-content: center;
  align-items: center;
  min-width: 152px;
  padding: 14px 24px;
  text-decoration: none;
  display: flex;
  overflow: hidden;
}

.iframe {
  border: 0 #000;
  border-radius: 14px;
  width: 100%;
  height: 181px;
}
```

---

### 8. FAQ.module.css
**Action:** Remove duplicate `.secondary-cta` (lines 205-225) - use global version instead.

**Status:** Other styles are clean ✅

---

### 9. Footer.module.css
**Action:** Remove duplicate `.primary-cta` (lines 188-211) - use global version instead.

**Keep these component-specific styles:**
```css
.footer-container { /* ... */ }
.footer-flex { /* ... */ }
.footer-row-1 { /* ... */ }
/* etc. */
```

---

### 10. PromotionalBanner.module.css
**Status:** ✅ Clean

**Add missing ticker animation (if not present):**
```css
.ticker-content {
  display: inline-flex;
  animation: ticker 40s linear infinite;
}

@keyframes ticker {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.text-span-9 {
  color: var(--bright-sun--300);
  font-weight: 700;
}
```

---

### 11. WhatsappFlotante.module.css
**Status:** ✅ Already has all necessary styles including `@keyframes pulse`

---

## Important Notes

### Duplicate Button Styles
The `.primary-cta` and `.secondary-cta` classes are currently defined in **FIVE PLACES**:
- globals.css (keep this one ✅)
- NavBar.module.css (remove)
- FAQ.module.css (remove)
- EligeTranquilo.module.css (remove)
- Hero.module.css (remove)
- ServicesSection.module.css (remove)
- CentroInspeccion.module.css (remove)
- Footer.module.css (remove)

**Solution:** Delete all CSS module versions and import from global scope:
```tsx
// In your TSX files, these classes will automatically use the global versions
// No changes needed in JSX, just remove from module.css files
<button className="primary-cta">Button</button>
<button className="secondary-cta">Button</button>
```

### Media Query Management
Component-specific responsive styles should stay in their respective modules. The cleaned `globals.css` only contains:
- Webflow grid responsive styles
- Shared utility responsive overrides

---

## Step-by-Step Migration Process

1. **Backup current files:**
   ```bash
   cp app/globals.css app/globals.css.backup
   ```

2. **Replace globals.css:**
   ```bash
   cp app/globals-CLEAN.css app/globals.css
   ```

3. **For each component module:**
   - Remove duplicate `.primary-cta` definitions
   - Remove duplicate `.secondary-cta` definitions
   - Verify component still works

4. **Test the application:**
   ```bash
   npm run dev
   ```

5. **Verify all components render correctly:**
   - NavBar
   - Hero
   - ProcessSection
   - ServicesSection
   - Benefits
   - EligeTranquilo
   - CentroInspeccion
   - FAQ
   - Footer
   - PromotionalBanner
   - WhatsappFlotante

6. **Check for any missing styles:**
   - If a component breaks, check if it relied on a global class
   - Add it to the component's module.css if it's component-specific
   - Or keep it in globals.css if it's truly shared

---

## Size Reduction

- **Before:** 4,918 lines
- **After:** ~1,200 lines
- **Reduction:** ~75%

---

## Benefits

1. ✅ **Clearer separation of concerns** - global vs component styles
2. ✅ **Eliminated duplication** - single source of truth for button styles
3. ✅ **Better maintainability** - find styles in predictable locations
4. ✅ **Faster CSS loading** - smaller global stylesheet
5. ✅ **Better CSS Modules scoping** - less global pollution

---

## Testing Checklist

After migration, verify:

- [ ] All pages load without visual breakage
- [ ] Buttons (.primary-cta, .secondary-cta) render correctly everywhere
- [ ] Responsive behavior works on mobile/tablet/desktop
- [ ] Hover states work on buttons
- [ ] FAQ accordion animations work
- [ ] WhatsApp floating button pulse animation works
- [ ] Promotional banner ticker animation works
- [ ] Navbar displays correctly
- [ ] Footer renders properly
- [ ] All images and icons display

---

## Rollback Plan

If issues occur:
```bash
cp app/globals.css.backup app/globals.css
```

Then debug specific components one at a time.
