#!/usr/bin/bash
echo "Installing python3-pip.."
sudo apt install python3-pip
echo "Installing virtual environment for Python"
sudo pip3 install virtualenv==20.4.5
virtualenv -p python3.7 expression
source expression/bin/activate
echo "Installing dependencies via pip3.."
sudo pip3 install -r requirements.txt
echo "Installing xml files for OpenCV.."
wget https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml 
mv haarcascade_frontalface_default.xml ./client/etc/cascades
echo "Installing Node.js and npm.."
sudo apt install nodejs npm
echo "Installing ws via npm.."
sudo npm install ws
echo "Installing zeromq@5 via npm.."
sudo npm install zeromq@5
echo "Done.."
