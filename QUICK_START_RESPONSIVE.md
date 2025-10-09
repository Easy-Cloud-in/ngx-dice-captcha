# Quick Start - New Responsive Test Page

## 🚀 Getting Started

### 1. Install Dependencies (if needed)

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

### 3. Open in Browser

Navigate to: `http://localhost:4200/responsive-test`

## 📱 What You'll See

### Tab Navigation

Click through 8 different screen sizes:

- 📱 Mobile S (320px)
- 📱 Mobile M (375px)
- 📱 Mobile L (414px)
- 💻 Tablet (768px)
- 💻 Laptop (1024px)
- 🖥️ Desktop (1440px)
- 🖥️ Desktop L (1920px)
- 🎬 Ultrawide (2560px)

### Each Tab Shows

1. **Info Card** - Device specs and dice count
2. **Device Frame** - Visual representation with dice captcha
3. **Device Details** - Width, height, and dice count badges

### Additional Sections

- **Features Grid** - 4 key responsive features
- **Reference Table** - Recommended dice counts per screen size

## 🎨 Material 3 Features

### Components Used

- Material Tabs for navigation
- Material Cards for content
- Material Icons for visual elements
- Material Chips for categories
- Material Buttons for interactions

### Theme Colors

- **Primary**: Purple (#6750a4)
- **Secondary**: Gray-purple (#625b71)
- **Tertiary**: Pink-red (#7d5260)
- **Surface**: Light purple (#fef7ff)

## ⚡ Performance Features

### @defer Loading

Each tab content uses Angular's @defer block:

```typescript
@defer (on viewport; on timer(500ms)) {
  // Content loads when visible or after 500ms
}
```

### Benefits

- ✅ Faster initial load
- ✅ Reduced memory usage
- ✅ Smooth tab transitions
- ✅ Better mobile performance

## 🎯 Key Features

### 1. Responsive Design

- Adapts to your screen size
- Device previews scale on mobile
- Touch-friendly tab navigation

### 2. Visual Device Frames

- Mobile: Rounded corners, thin bezels
- Tablet: Medium bezels, rounded corners
- Desktop: Thick bezels, monitor-like appearance

### 3. Smart Dice Counts

- Small screens: 2-3 dice
- Medium screens: 3-4 dice
- Large screens: 4-6 dice

### 4. Loading States

- Placeholder while loading
- Spinning icon during load
- Smooth fade-in animation

## 🔧 Customization

### Change Screen Sizes

Edit `screenSizes` array in `responsive-test.component.ts`:

```typescript
protected readonly screenSizes: ScreenSize[] = [
  {
    id: 'custom',
    name: 'Custom Size',
    icon: 'devices',
    width: 600,
    height: 800,
    diceCount: 3,
    description: 'My custom size',
    category: 'tablet',
  },
  // ... more sizes
];
```

### Change Theme Colors

Edit Material theme in `styles.scss`:

```scss
$primary-palette: mat.define-palette(mat.$violet-palette);
$accent-palette: mat.define-palette(mat.$pink-palette);
```

### Adjust Dice Configuration

Modify the config in the template:

```html
<ngx-dice-captcha
  [config]="{
    diceCount: screen.diceCount,
    fillContainer: false,
    maintainAspectRatio: true,
    enableDynamicResize: true,
    // Add more config options
  }"
/>
```

## 📊 Testing Different Sizes

### Desktop Testing

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select different device presets
4. Or set custom dimensions

### Mobile Testing

1. Open on actual mobile device
2. Or use browser's device emulation
3. Test portrait and landscape
4. Verify touch interactions

## 🐛 Troubleshooting

### Material Icons Not Showing

- Check internet connection (fonts load from Google)
- Verify `index.html` has Material Icons link
- Clear browser cache

### Tabs Not Working

- Ensure `provideAnimations()` in `app.config.ts`
- Check Material modules are imported
- Verify Angular Material is installed

### Dice Not Loading

- Check console for errors
- Verify ngx-dice-captcha is installed
- Ensure Three.js and Cannon-es are available

### Styling Issues

- Clear browser cache
- Check Material theme is applied
- Verify SCSS compilation

## 📝 Code Structure

```
responsive-test/
├── responsive-test.component.ts    # Component logic
├── responsive-test.component.html  # Template with tabs
└── responsive-test.component.scss  # Material 3 styles
```

## 🎓 Learning Resources

### Angular Material

- [Material 3 Documentation](https://material.angular.io)
- [Component Examples](https://material.angular.io/components)

### Angular @defer

- [Deferrable Views Guide](https://angular.dev/guide/defer)
- [Performance Best Practices](https://angular.dev/best-practices/runtime-performance)

### ngx-dice-captcha

- [Library Documentation](../README.md)
- [API Reference](../docs/API.md)

## ✨ What's New

### Compared to Old Version

- ✅ Material 3 design system
- ✅ Tab-based navigation
- ✅ @defer lazy loading
- ✅ Device frame visualization
- ✅ Cleaner code structure
- ✅ Better mobile experience
- ✅ Improved accessibility
- ✅ Professional appearance

## 🎉 Enjoy!

The new responsive test page showcases ngx-dice-captcha in a modern, professional way. It's perfect for:

- Demonstrating responsive capabilities
- Testing different screen sizes
- Showing potential users the library
- Documentation and presentations

Happy testing! 🎲
