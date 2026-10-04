# Why I Built Desio ScanGo

## The convenience store

The first time I saw barcode scanning at a convenience store, I thought it was magic.

You hold the barcode in front of a device, and the computer recognises the product, shows the price and completes the whole checkout. I remember thinking: if I had a store of my own one day and could scan and check out like a real cashier, that would be wonderful.

## A small experiment

Later, I actually tried to build a small convenience store system of my own.

I found a free and open source point-of-sale system, and discovered that some software could connect a phone to a computer and turn the phone into a scanning device. So I hooked a phone up to a computer and built a simple checkout flow at home:

- the phone scans the product barcode
- the result travels to the computer
- the POS system recognises the product
- a real convenience store checkout, reproduced at home

That was the first moment I truly felt it:

**Ordinary devices, combined through software, can become a complete business system.**

It was only a personal experiment, but it fascinated me.

## A tool that disappeared

Later, that phone scanner software stopped being maintained, and eventually stopped working altogether.

Years later I went looking for something similar again — a tool that lets a phone scan a barcode, connect to a computer, and type the result into a POS system or any other software.

What I found instead:

- most apps only let the phone scan for itself
- many tools depend on specific hardware
- few options were simple, open source and cross-platform
- very few could genuinely replace a scanner gun

And then it hit me:

**Why not build one myself?**

## How Desio ScanGo was born

So I started building Desio ScanGo.

Its goal is simple: **make the phone a wireless barcode scanner again.**

Through the phone camera:

```text
Phone
 ↓
Scan a barcode / QR code
 ↓
Transfer over the network
 ↓
Computer
 ↓
Typed wherever you need it
```

No extra hardware to buy.

No complicated setup.

All you need is:

- a phone
- a computer
- a local network

## More than reimplementing scanning

Desio ScanGo started from a childhood dream about convenience stores.

But what it wants to explore is not just scanning. It is this: **how the ordinary devices already in our hands can gain new abilities through software.**

Going further, a phone could become:

- a barcode scanner
- an OCR text input device
- a wireless webcam
- an AI vision capture terminal
- a wireless extension of your computer

## Project Philosophy

Years ago, I thought a barcode scanner was a magical piece of professional equipment.

Later I realised:

The thing that is truly magical is not the scanner itself. It is the fact that

**software can redefine what an ordinary device is capable of.**

Desio ScanGo wants to share that ability with more people.

So that the phone in everyone's pocket can become a new tool.
