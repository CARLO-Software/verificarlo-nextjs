# Quick Fixes - Exact Lines to Delete

This document shows the exact duplicate code blocks to remove from each CSS Module file.

---

## 1. NavBar/NavBar.module.css

**DELETE lines 56-76:**
```css
.secondary-cta {
  grid-column-gap: 10px;
  background-color: var(--shark--950);
  color: var(--bright-sun--50);
  text-align: center;
  letter-spacing: -.03px;
  border-radius: 100px;
  flex: 0 auto;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  font-family: DM Sans, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
}

.secondary-cta:hover {
  background-color: var(--shark--900);
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## 2. Hero/Hero.module.css

**DELETE lines 107-126:**
```css
.primary-cta {
  background-color: var(--bright-sun--300);
  color: var(--shark--950);
  letter-spacing: -.03px;
  white-space: nowrap;
  border-radius: 100px;
  justify-content: center;
  align-items: center;
  padding: 14px 24px;
  font-family: DM Sans, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
  display: flex;
}

.primary-cta:hover {
  background-color: var(--bright-sun--400);
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## 3. ServicesSection/ServicesSection.module.css

**DELETE lines 161-184:**
```css
.primary-cta {
  background-color: var(--bright-sun--300);
  color: var(--shark--950);
  letter-spacing: -.03px;
  white-space: nowrap;
  border-radius: 100px;
  justify-content: center;
  align-items: center;
  padding: 14px 24px;
  font-family: DM Sans, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
  display: flex;
}

.primary-cta:hover {
  background-color: var(--bright-sun--400);
}

.primary-cta._w-full {
  width: 100%;
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## 4. EligeTranquilo/EligeTranquilo.module.css

**DELETE lines 114-134:**
```css
.secondary-cta {
  grid-column-gap: 10px;
  background-color: var(--shark--950);
  color: var(--bright-sun--50);
  text-align: center;
  letter-spacing: -.03px;
  border-radius: 100px;
  flex: 0 auto;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  font-family: DM Sans, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
}

.secondary-cta:hover {
  background-color: var(--shark--900);
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## 5. CentroInspeccion/CentroInspeccion.module.css

**DELETE lines 148-171:**
```css
.primary-cta {
  background-color: var(--bright-sun--300);
  color: var(--shark--950);
  letter-spacing: -.03px;
  white-space: nowrap;
  border-radius: 100px;
  justify-content: center;
  align-items: center;
  padding: 14px 24px;
  font-family: DM Sans, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
  display: flex;
}

.primary-cta:hover {
  background-color: var(--bright-sun--400);
}

.primary-cta._w-full {
  width: 100%;
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## 6. FAQ/FAQ.module.css

**DELETE lines 205-225:**
```css
.secondary-cta {
  grid-column-gap: 10px;
  background-color: var(--shark--950);
  color: var(--bright-sun--50);
  text-align: center;
  letter-spacing: -.03px;
  border-radius: 100px;
  flex: 0 auto;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  font-family: DM Sans, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
}

.secondary-cta:hover {
  background-color: var(--shark--900);
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## 7. Footer/Footer.module.css

**DELETE lines 188-211:**
```css
.primary-cta {
  background-color: var(--bright-sun--300);
  color: var(--shark--950);
  letter-spacing: -.03px;
  white-space: nowrap;
  border-radius: 100px;
  justify-content: center;
  align-items: center;
  padding: 14px 24px;
  font-family: DM Sans, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
  display: flex;
}

.primary-cta:hover {
  background-color: var(--bright-sun--400);
}

.primary-cta._w-full {
  width: 100%;
}
```

**✅ REASON:** This is defined globally in globals.css.

---

## Automated Cleanup (Optional)

If you're comfortable with terminal commands, you can use these to automate the deletions:

### macOS/Linux:
```bash
# Backup first!
find app/components -name "*.module.css" -exec cp {} {}.backup \;

# Then manually edit each file to remove duplicates
```

### Windows (PowerShell):
```powershell
# Backup first!
Get-ChildItem -Path app\components -Filter *.module.css -Recurse | ForEach-Object {
  Copy-Item $_.FullName "$($_.FullName).backup"
}

# Then manually edit each file to remove duplicates
```

---

## After Deleting Duplicates

1. **Replace globals.css:**
   ```bash
   cp app/globals-CLEAN.css app/globals.css
   ```

2. **Test immediately:**
   ```bash
   npm run dev
   ```

3. **Check each page:**
   - Home page
   - Scroll through all sections
   - Verify buttons still have correct styling
   - Test responsive breakpoints

4. **If everything works:**
   ```bash
   git add .
   git commit -m "refactor: eliminate CSS duplication, clean globals.css"
   ```

---

## Validation Checklist

After cleanup, verify:

- [ ] NavBar buttons render correctly
- [ ] Hero CTA buttons work
- [ ] Services section cards have proper styling
- [ ] Benefits section displays correctly
- [ ] FAQ buttons function properly
- [ ] Footer contact button works
- [ ] CentroInspeccion map button renders
- [ ] EligeTranquilo section CTA displays
- [ ] All hover states work
- [ ] Responsive design intact at all breakpoints

---

## Important Notes

### JSX Changes Required?
**NO!** The class names remain the same:
```tsx
// This stays exactly as is - no changes needed
<button className="primary-cta">Click me</button>
<button className="secondary-cta">Contact</button>
```

### Why This Works
CSS Modules and global styles coexist. When you use a class name that isn't in the module, it falls back to global scope. By removing the duplicate module definitions, the global versions automatically take effect.

### Specificity
Global `.primary-cta` has the same specificity as a module `.primary-cta`. The one defined last in the cascade wins. By removing module duplicates, we eliminate this conflict and ensure consistent styling.

---

## Rollback If Needed

If anything breaks:
```bash
# Restore module backups
find app/components -name "*.module.css.backup" -exec sh -c 'mv "$1" "${1%.backup}"' _ {} \;

# Restore original globals.css
cp app/globals.css.backup app/globals.css

# Restart dev server
npm run dev
```
