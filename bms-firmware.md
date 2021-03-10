---
title: BMS firmware
subtitle: Firmware extraction and modifications.
layout: page
show_sidebar: false
---

# Tools

You will need additional hardware to manipulate the firmware in the BMS:
* PICkit3 programmer (original) [https://www.microchip.com/Developmenttools/ProductDetails/PG164130](https://www.microchip.com/Developmenttools/ProductDetails/PG164130)
* PICkit3.5 (clone, I tested with this one) [https://www.amazon.com/Bolsen-PICKIT3-5-Programmer-Programming-Simulation/dp/B07VLMFW8K](https://www.amazon.com/Bolsen-PICKIT3-5-Programmer-Programming-Simulation/dp/B07VLMFW8K)
* Other versions will be probably fine too. You will just have to research bit more.

As for software, you will need **MPLAB IPE**
* **Dowload:** It's included in a package together with MPLAB X IDE: [https://www.microchip.com/en-us/development-tools-tools-and-software/mplab-x-ide](https://www.microchip.com/en-us/development-tools-tools-and-software/mplab-x-ide)
* Read more about `MPLAB IPE`: [https://www.microchip.com/en-us/development-tools-tools-and-software/embedded-software-center/mplab-integrated-programming-environment](https://www.microchip.com/en-us/development-tools-tools-and-software/embedded-software-center/mplab-integrated-programming-environment)

# Wiring

* PICkit3 basic pinout: [pickit3_50002010B.pdf](assets/pickit3_50002010B.pdf)
* BMS `PROG1` pinout:
  * ![](images/bms_xr_2.0.5_PROG1.png)
* Just connect pins with the same name together.
  * ![](images/bms_pickit.jpg)
* Connect PICkit to PC.

# Downloading the firmware

[![OneWheel BMS Firmware backup](https://img.youtube.com/vi/gtJDZtsUXzQ/0.jpg)](https://www.youtube.com/watch?v=gtJDZtsUXzQ)

# I have the `*.hex` file. Now what?

* [Consider supporting me.](https://github.com/sponsors/radimklaska) :)
* Check the BMS PCB revision (something like `2.0.5` in the corner of the PCB), board hardware version (`4209`, in your app, under `dignostics`) and send info about your versions and `.hex` file to [radim@klaska.net](radim@klaska.net). Thanks! :)
* Have a look at [https://ghidra-sre.org/](https://ghidra-sre.org/)
  * This will decompile the `*.hex` and show actual code. (Keep in mind that decompiled code is ugly and not very intuitive.)
* If your board is `4210` or newer, keep the backup in case you need to replace your BMS (Not confirmed to work.)
* Stay tuned - we might figure something out...

# Expectations / Limitations

Note: Most of this is just a theory for me.

|Relevant revisions|Expectation/Limitation|Note|
|---|---|---|
|4209 and older|Percentage fix for boards with upgraded battery is possible by altering BMS firmware.|On my ToDo list.|
|4210|Hit or miss for battery upgrades. Some issues reported with 4210 / Gemini 4150. Read more on the website of your battery supplier.||
|4211|No more battery upgrades.|(No bigger capacity, you can still replace the battery with one of the same capacity.)|
|4212|`Code Protection` enabled on the PIC on BMS. = No firmware downloads. Controller <-> BMS pairing starts here.|If the pcb is still the same, it should be possible to replace the chip and program it with older fw. It may not be paired any more, but it should work with older boards at least.|

General limitations of working with BMS firmware:
* Most likely no bigger battery "unlocks" for `4210` or newer with BMS alterations.
