# PWA Icon Generator Script
# This script helps generate the required icon sizes for PWA

# You can use online tools or image editing software to create these sizes from Meteosran-logo.png:
# 
# Required icon sizes:
# - 48x48 (for Android notifications)
# - 72x72 (for Android home screen)
# - 96x96 (for Android home screen)
# - 144x144 (for Windows tiles)
# - 192x192 (for Android splash screen)
# - 512x512 (for Android splash screen and app stores)
#
# For better PWA support, also create:
# - 128x128 (already have as .ico)
# - 180x180 (for iOS)
# - 152x152 (for iOS)
# - 120x120 (for iOS)
#
# Maskable icons (recommended):
# Create versions with safe area padding for maskable icons
# The logo should be within 80% of the icon area (20% padding on all sides)

echo "PWA Icon Requirements:"
echo "1. Use Meteosran-logo.png as the base"
echo "2. Create the following sizes: 48, 72, 96, 120, 144, 152, 180, 192, 512"
echo "3. For maskable icons, add 20% padding on all sides"
echo "4. Save as PNG format with transparent background if possible"
echo "5. Optimize for web delivery"

# You can use tools like:
# - Adobe Photoshop/Illustrator
# - GIMP (free)
# - Online PWA icon generators
# - ImageMagick (command line)
# - PWA Builder (Microsoft tool)

# Example ImageMagick commands (if you have it installed):
# convert Meteosran-logo.png -resize 48x48 icon-48x48.png
# convert Meteosran-logo.png -resize 72x72 icon-72x72.png
# convert Meteosran-logo.png -resize 96x96 icon-96x96.png
# convert Meteosran-logo.png -resize 144x144 icon-144x144.png
# convert Meteosran-logo.png -resize 192x192 icon-192x192.png
# convert Meteosran-logo.png -resize 512x512 icon-512x512.png
