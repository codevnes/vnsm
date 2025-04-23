# TinyMCE Integration Guide

## Installation

To integrate TinyMCE editor into this project, follow these steps:

1. Install the required packages:

```bash
npm install @tinymce/tinymce-react tinymce
```

or if you're using yarn:

```bash
yarn add @tinymce/tinymce-react tinymce
```

2. Get a TinyMCE API key:

Visit [TinyMCE's website](https://www.tiny.cloud/auth/signup/) to sign up for a free API key.

3. Add your API key to the TinyEditor component:

Open `frontend/src/components/posts/TinyEditor.tsx` and replace `your-api-key` with your actual TinyMCE API key:

```tsx
<Editor
  apiKey="your-api-key" // Replace with your actual TinyMCE API key
  // ... other props
/>
```

## Usage

The ModernPostForm component is now configured to use TinyMCE. It includes:

- A modern dark theme interface
- Image upload and library integration
- Full formatting capabilities
- Integration with the form validation system

If you're using the `ModernPostForm` component, you don't need to make any additional changes - it's already set up to use TinyMCE.

## Troubleshooting

If you encounter issues with the TinyMCE editor:

1. Make sure the API key is correctly set
2. Check that both packages (`@tinymce/tinymce-react` and `tinymce`) are installed
3. Look for console errors that might indicate missing plugins or configuration issues

## Customization

You can customize the TinyMCE editor by modifying the configuration in `TinyEditor.tsx`. The current configuration includes:

- Dark theme styling
- Common editing plugins
- Image insertion capabilities
- Table support
- Custom content styling for dark mode

Refer to the [TinyMCE documentation](https://www.tiny.cloud/docs/) for more configuration options. 