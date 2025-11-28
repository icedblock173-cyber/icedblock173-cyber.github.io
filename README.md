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
</body>
</html>
