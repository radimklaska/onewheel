# [OneWheel technical info](https://radimklaska.github.io/onewheel/)

## Disclaimer

I'm just trying to aggregate bits of technical details I was able to find published on the internet. (See the credits sections.) This is in no way a tutorial to do anything. I'm not responsible for any damage you cause by using this info. Even though I do my best to verify and double-check I'm not guaranteeing the correctness of the information aggregated in this repo.

# OneWheel Battery schema and connector types

## Overview

Overview, BMS connector (battery pack side), XT-60 connector, and Pint/XR+ battery pack layouts.

![](images/battery_schema_xr_and_pint.png)

Each pack has 4 10k NTC Thermistors placed in-between cells for temperature monitoring.

### Part numbers:

* XR+ cells
  * `Samsung 30Q 18650 3000mAh 15A`
  * [https://www.imrbatteries.com/samsung-30q-18650-3000mah-15a-battery/](https://www.imrbatteries.com/samsung-30q-18650-3000mah-15a-battery/)
* Pint cells
  * `Sony | Murata VTC5D 18650 2800mAh 25A`
  * [https://www.imrbatteries.com/sony-vtc5d-18650-2600mah-25a-battery/](https://www.imrbatteries.com/sony-vtc5d-18650-2600mah-25a-battery/)
* BMS Connector (PCB Side)
  * `BM26B-ZPDSS-TF(LF)(SN)`
  * [https://www.digikey.com/product-detail/en/jst-sales-america-inc/BM26B-ZPDSS-TF(LF)(SN)/455-2548-6-ND/2472626](https://www.digikey.com/product-detail/en/jst-sales-america-inc/BM26B-ZPDSS-TF(LF)(SN)/455-2548-6-ND/2472626)
* BMS Connector (Battery Pack)
  * `ZPDR-26V-S`
  * [https://www.digikey.com/product-detail/en/jst-sales-america-inc/ZPDR-26V-S/455-2536-ND/2472569](https://www.digikey.com/product-detail/en/jst-sales-america-inc/ZPDR-26V-S/455-2536-ND/2472569)
* BMS Connector Pins
  * `SZPD-002T-P0.3`
  * [https://www.digikey.com/product-detail/en/jst-sales-america-inc/SZPD-002T-P0.3/455-2539-1-ND/2472595](https://www.digikey.com/product-detail/en/jst-sales-america-inc/SZPD-002T-P0.3/455-2539-1-ND/2472595)
* 10k NTC Thermistors
  * `NTCLE413`
  * [https://www.digikey.com/catalog/en/partgroup/ntcle413/11021](https://www.digikey.com/catalog/en/partgroup/ntcle413/11021)

## BMS pinout

Close-up of the BMS connector pinout and the XT-60 connector

![](images/bms_pinout.png)

## +XR battery schema

Close-up of the XR+ Battery pack layout w/ BMS connections. (Thermistors are just evenly placed around the pack between cells.)

![](images/battery_schema_xr.png)

## Pint battery schema

Close-up of the Pint Battery pack layout w/ BMS connections. (Thermistors are just evenly placed around the pack between cells.)

![](images/battery_schema_pint.png)

# Charger pinout

## Onewheel Pint Home Charger

63 V NMC battery charger

- Input: 100-240 Vac, 50/60 Hz, 1 A, 100 VA
- Output: 63 Vdc, 1.3 A

Connector (2 pin female mini DIN) pinout:

![](images/charger_pint.svg)

Voltage measurements across pairs of leads:

| - | + | Result  |
|---|---|---------|
| 1 | 2 | -63 Vdc |
| 2 | 1 | +63 Vdc |

Found polarity:

1. 63 Vdc
2. Ground

## Onewheel+ XR Home Charger

63 V NMC battery charger

- Input: 100-240 Vac, 50/60 Hz, 300 VA
- Output: 63 Vdc, 3 A

Connector (3 pin female XLR) pinout:

![](images/charger_xr.svg)

Voltage measurements across pairs of leads:

| - | + | Result  |
|---|---|---------|
| 1 | 2 | 63 Vdc  |
| 1 | 3 | 63 Vdc  |
| 2 | 1 | -63 Vdc |
| 2 | 3 | 0 Vdc   |
| 3 | 1 | -63 Vdc |
| 3 | 2 | 0 Vdc   |

Found polarity:

1. Ground
2. 63 Vdc
3. 63 Vdc

## Other Models

The Onewheel+ is not NMC I don't think and the charger specs are
58 Vdc / 3.5 A I think, the Onewheel+ XR ultracharger is probably
63 Vdc / 5 A, but I don't know either of these, so I cannot verify
these numbers.

# Onewheel+ XR to Onewheel Pint Charger Adapter

Connectors:

- 3pin female XLR
- 2pin female mini DIN

Wiring:

| Onewheel+ XR | Onewheel+ Pint |
|--------------|----------------|
| ![](images/charger_xr.svg)  | ![](images/charger_pint.svg)  |
| 1            | 2              |
| 2            | 1              |
| 3            |                |

If you do this and it wrecks your board, blame yourself, because I
am not responsible for that.

# Credits

* [TomasHubelbauer](https://github.com/TomasHubelbauer)
  * [Sponsor](https://github.com/sponsors/TomasHubelbauer)
  * Originaly started the repo
  * Pint and +XR charger info
* [radimklaska](https://github.com/radimklaska)
  * [Sponsor](https://github.com/sponsors/radimklaska)
  * Further info aggregation
  * Maintainig the struture, moderation...
  * Trying to keep everything up to date
* [That-Canadian](https://www.reddit.com/user/That-Canadian)
  * Battery schema, BMS pointous, connector types, cell types
  * Source:
    * OP: [https://imgur.com/a/Sif7Wlo#Axt8gvk](https://imgur.com/a/Sif7Wlo#Axt8gvk)
    * Reference: [https://www.reddit.com/r/onewheel/comments/iutvnf/onewheel_battery_pack_schematics/](https://www.reddit.com/r/onewheel/comments/iutvnf/onewheel_battery_pack_schematics/)
