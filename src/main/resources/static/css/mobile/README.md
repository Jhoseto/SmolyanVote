# Mobile CSS Architecture - SmolyanVote

## Overview
This directory contains mobile-specific CSS files that override desktop styles for devices ≤768px width.

## Loading Strategy
Mobile CSS files are loaded AFTER desktop CSS using media queries:
```html
<link rel="stylesheet" href="/css/mobile/mobile-base.css" media="(max-width: 768px)">
```

## File Structure

### Core Files (Load Order Important)
1. **mobile-base.css** - Base mobile styles, typography, touch targets
2. **mobile-navbar.css** - Navigation optimization
3. **mobile-modals.css** - Fullscreen modals
4. **mobile-forms.css** - Form controls optimization
5. **mobile-tables.css** - Responsive tables

### Feature Files
- **publications-mobile.css** - Publications page
- **events-mobile.css** - Events system (SimpleEvent, Referendum, MultiPoll)
- **signals-mobile.css** - Signals with interactive map
- **profile-mobile.css** - User profiles
- **comments-mobile.css** - Comments system
- **notifications-mobile.css** - Notifications & toasts
- **footer-mobile.css** - Footer optimization
- **admin-mobile.css** - Admin dashboard

## Design Principles

### 1. Touch-Friendly
- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Visual feedback on tap/press

### 2. Mobile-First Interactions
- Bottom sheets for filters
- Swipe gestures where appropriate
- Pull-to-refresh support
- Floating action buttons (FAB)

### 3. Performance
- CSS-only animations where possible
- Hardware acceleration (transform, opacity)
- Minimal reflows/repaints
- Lazy loading support

### 4. Accessibility
- Proper contrast ratios
- Focus indicators
- Screen reader support
- Reduced motion support

## CSS Variables
Available in mobile-base.css:
```css
--mobile-header-height: 56px;
--mobile-bottom-nav-height: 60px;
--mobile-padding: 16px;
--mobile-touch-target: 44px;
--mobile-border-radius: 12px;
```

## Safe Area Support
Handles notched devices (iPhone X+):
```css
@supports (padding: max(0px)) {
  body {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
  }
}
```

## Important Notes

### DO NOT:
- Modify desktop CSS files
- Change HTML structure (except minimal additions)
- Use `!important` excessively (only when overriding desktop styles)
- Add dependencies on external libraries

### DO:
- Use specific selectors to override desktop styles
- Test on real devices (iOS & Android)
- Maintain consistent spacing (multiples of 4px)
- Follow existing naming conventions
- Use Bootstrap Icons only

## Testing Checklist

### Devices
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 12/13/14 Pro Max (428px)
- [ ] Android (various sizes 360px - 412px)
- [ ] iPad (768px)

### Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Features to Test
- [ ] Navigation drawer
- [ ] Forms (no zoom on input focus)
- [ ] Modals (fullscreen)
- [ ] Comments (nested replies)
- [ ] Maps (touch gestures)
- [ ] Pull to refresh
- [ ] Offline mode (PWA)
- [ ] Add to home screen (PWA)

## Troubleshooting

### Issue: iOS zoom on input focus
**Solution:** Ensure all inputs have `font-size: 16px` minimum

### Issue: Horizontal scroll
**Solution:** Check for elements with fixed width > 100vw

### Issue: Sticky elements overlap
**Solution:** Adjust z-index hierarchy in mobile-base.css

### Issue: Touch events not working
**Solution:** Check for `pointer-events: none` or overlapping elements

## Performance Tips

1. **Minimize CSS specificity** - Use class selectors
2. **Avoid expensive properties** - box-shadow, border-radius (in moderation)
3. **Use transform over position** - for animations
4. **Debounce scroll events** - in JavaScript
5. **Use will-change sparingly** - only for animating elements

## Browser Support
- iOS Safari 12+
- Chrome Mobile 80+
- Samsung Internet 12+
- Firefox Mobile 80+

## Maintenance

When adding new mobile CSS:
1. Create file in `/css/mobile/`
2. Follow naming convention: `feature-mobile.css`
3. Add to `topHtmlStyles.html` with media query
4. Document in this README
5. Test on real devices

---
Last Updated: 2025-01-19
