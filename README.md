<html>
<head>
<link rel="stylesheet" href="https://pyscript.net/releases/2025.11.2/core.css" />
<script type="module" src="https://pyscript.net/releases/2025.11.2/core.js"></script>
</head>
<body>
        <script type="py">
        import base64, gzip

        b64 = """H4sIAAAAAAAACqWTO24DMQxEL6QAHJLaD1y5yQV8gClc-go5fETNplsjNtxwVhryiSSwj1tsDUyjE94Z9N4JSFyiy-QXuBBmxpUgeoWNxo34ASfC_DUEPkfsp4jKUcFLEGfVn4HeWsk4f87IU0aV_w1k_43Tn45j72xleYJpjyuiWUmXLJJsI-p7ndEPXydsJbfY5c0ozjSuOaNcmJKU5UpzZfjaUOkmgcSnuFAuSsgLeaHWUrAULLvK5UUoMyVqP_Re_SIl-xQcU6jOj3ah5odc0PaxEG9jp21QbbzT663R092_4_ILThAX-XQDAAA="""

        data = base64.urlsafe_b64decode(b64)
        decompressed = gzip.decompress(data)
        print(decompressed.decode(errors="replace"))
        </script>
        <script>
            // Store the original console.log function to still log to the developer console
            const originalConsoleLog = console.log;

            // Get the HTML element where output will be displayed
            const outputArea = document.getElementById('output-area');

            // Override console.log
            console.log = function(...args) {
                // Call the original console.log to maintain developer console output
                originalConsoleLog.apply(console, args);

                // Convert arguments to a string for display in HTML
                const message = args.map(arg => {
                    if (typeof arg === 'object' && arg !== null) {
                        try {
                            return JSON.stringify(arg, null, 2); // Prettify objects
                        } catch (e) {
                            return String(arg); // Fallback for circular references or complex objects
                        }
                    }
                    return String(arg);
                }).join(' ');

                // Create a new paragraph or list item for each message
                const messageElement = document.createElement('p');
                messageElement.textContent = message;
                outputArea.appendChild(messageElement);

                // Optional: Scroll to the bottom to show latest messages
                outputArea.scrollTop = outputArea.scrollHeight;
            };
        </script>
</body>
</html>
