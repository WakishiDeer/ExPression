# ExPression

## Overview
### The smart way to express you and others' emotion
ExPression provide you with great expressive way of emotion abstractly, using only your RGB-camera or display which include faces.

## Description
For more details, please refer to my paper.
https://www.interaction-ipsj.org/proceedings/2021/data/pdf/3B12.pdf

## Requirement
Linux, MacOS, or Windows are required to install

## Usage
Run commands written in below by using **separetely terminal**.

`$ python3 main.py user_name localhost 8889 --screen` Terminal #1

`$ python main.py user_name --screen` Terminal #2

## Install (when using Linux)
**NOTE: If you are try to install your Windows or MacOS devices, please install dependencies or libraries yourself by reading "./install.sh"**

1. Clone this repository to your arbitary location
2. Move to "ExPression" folder and run './install.sh'

`$ sh install.sh`

3. Move to "./client/src/python" and "./server/src/python" respectively

`$ cd ./client/src/python` Terminal #1

`$ cd ./server/src/python` Terminal #2

4. Run both of "main.py" 

`$ python3 main.py user_name localhost 8889 --screen` Terminal #1

`$ python main.py user_name --screen` Terminal #2

