from MeteorClient import MeteorClient
# import pygtk
# import gtk
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk
from gi.repository import Gdk
from gi.repository.GdkPixbuf import Pixbuf,InterpType

import fileinput
import errno, sys
import time
import urllib2
from multiprocessing.dummy import Pool as ThreadPool
import os
import calendar
import requests
import socket

from credentials import METEOR_USERNAME
from credentials import METEOR_PASSWORD
from credentials import WEBHOOKURL

from datetime import date


USERNAME = socket.gethostname()
messagequeue = []

# PARENT_DIMENSIONS_X = 450
# PARENT_DIMENSIONS_Y = 680
PARENT_DIMENSIONS_X = 320
PARENT_DIMENSIONS_Y = 442
CHILD_DIMENSIONS_X = 150
CHILD_DIMENSIONS_Y = 200


class MyProgram:
    def __init__(self):
        slackLog("Gate scanner started.")
        self.parents= {}
        #load parents
        self.client = MeteorClient('ws://chloe.asianhope.org:8080/websocket',debug=False)
        self.client.connect()
        self.client.login(METEOR_USERNAME,METEOR_PASSWORD)
        self.client.subscribe('cards')
        self.client.subscribe('scans')
        time.sleep(3) #give it some time to finish loading everything
        self.all_cards = self.client.find('cards')
        slackLog("Pulled records for: "+str(len(self.all_cards))+" cards")

        for card in self.all_cards:
            try:
                barcode = card['barcode']
                name = card['name']
                cardtype = card['type']
                expires = card['expires']
                profile = card.get('profile',barcode+".JPG") #default picture
                associations = card['associations']
                self.parents.update({barcode:card})

            except KeyError:
                slackLog(barcode+' has missing data',delay=True)

                pass
        # load style css for template
        screen = Gdk.Screen.get_default()
        css_provider = Gtk.CssProvider()
        css_provider.load_from_path('style.css')
        context = Gtk.StyleContext()
        context.add_provider_for_screen(screen, css_provider,
                                        Gtk.STYLE_PROVIDER_PRIORITY_USER)

        # connect to glade teamplate
        self.gladefile = "cardmanager.glade"
        self.glade = Gtk.Builder()
        self.glade.add_from_file(self.gladefile)
        self.glade.connect_signals(self)

        #get window from glade
        self.app_window=self.glade.get_object("main_window") # Window Name in GLADE
        self.app_window.fullscreen()
        # quit app
        self.app_window.connect("delete-event",Gtk.main_quit)

        #change color of window??
        #self.green = gtk.gdk.color_parse('green')
        #self.black = gtk.gdk.color_parse('black')
        #self.app_window.modify_bg(gtk.STATE_NORMAL,self.black)

        # get objects from glade
        self.header = self.glade.get_object("header")
        self.header_context = self.header.get_style_context()
        self.header_title = self.glade.get_object("header_title")
        self.parent_image = self.glade.get_object("img_parent")
        self.child_container = self.glade.get_object("grid1")
        self.button_search = self.glade.get_object("btn_search")
        self.entry = self.glade.get_object("search_input")
        self.pname = self.glade.get_object("lbl_pname")
        self.pbarcode = self.glade.get_object("lbl_pbarcode")
        self.pexpires = self.glade.get_object("lbl_pexpires")
        self.error_message = self.glade.get_object("lbl_error_message")

        #add event to button_search
        self.button_search.connect("clicked", self.search_button_clicked, "3")


        # display children images
        pixbuf = Pixbuf.new_from_file("static/logo.png")
        scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,InterpType.BILINEAR)

        self.pickup_students = ['0']*9 #seed the list with the size we want
        for i in range(0,9):
            self.pickup_students[i] = Gtk.Image()
            self.pickup_students[i].set_from_pixbuf(scaled_buf)

        self.label=Gtk.Table(3,3,True)
        self.label.attach(self.pickup_students[0],0,1,0,1)
        self.label.attach(self.pickup_students[1],1,2,0,1)
        self.label.attach(self.pickup_students[2],2,3,0,1)

        self.label.attach(self.pickup_students[3],0,1,1,2)
        self.label.attach(self.pickup_students[4],1,2,1,2)
        self.label.attach(self.pickup_students[5],2,3,1,2)
        self.label.attach(self.pickup_students[6],0,1,2,3)
        self.label.attach(self.pickup_students[7],1,2,2,3)
        self.label.attach(self.pickup_students[8],2,3,2,3)
        self.label.set_col_spacings(10)
        self.label.set_row_spacings(10)
        # add lebel of image to container in glade
        self.child_container.add(self.label)

        # display parent picture
        pixbuf = Pixbuf.new_from_file("static/logo.png")
        scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
        self.parent_image.set_from_pixbuf(scaled_buf)


        # self.button_search.can_default(True)
        # self.button_search.grab_default()
        self.entry.set_activates_default(True)
        self.app_window.set_focus(self.entry)

        self.error_message.set_text("")
        self.app_window.show_all()
        return

    def search_button_clicked(self, widget, data=None):
        associations = []

        self.error_message.set_text("")
        # remove classes in header
        header_class_list = self.header_context.list_classes()
        for class_name in header_class_list:
            self.header_context.remove_class(class_name)

        for i in range(0,9):
            #make sure all pictures are reset
            pixbuf = Pixbuf.new_from_file("static/logo.png")
            scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,InterpType.BILINEAR)
            self.pickup_students[i].set_from_pixbuf(scaled_buf)

        #grab pid
        pid = self.entry.get_text()
        slackLog('Scanned card: '+pid,delay=True)

        #do a lookup for the name
        try:
            #get parent information
            #parent_card = self.client.find_one('cards', selector={'barcode': pid})
            parent_card = self.parents[pid]
            slackLog('```'+str(parent_card)+'```',delay=True)

            if not parent_card:
                self.header_title.set_text("Invalid Card!")
                self.header_context.add_class('header_invalid_card')
                self.pname.set_text("Card Not Found!")
                self.pbarcode.set_text("XXXX")
                self.pexpires.set_text("xxxx-xx-xx")
                pixbuf = Pixbuf.new_from_file("static/NA.JPG")
                scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
                self.parent_image.set_from_pixbuf(scaled_buf)
            else:
                pname = parent_card.get('name', pid)
                parent_picture = parent_card.get('profile',pid+".JPG")
                expires = parent_card.get('expires',"Expiry not set")
                barcode = parent_card.get('barcode',"Barcode not set")
                associations = parent_card.get('associations',[])

                # if card expired
                if expires < date.today().isoformat():
                    associations = []
                    self.header_title.set_text("Card has expired!")
                    self.header_context.add_class('header_expired')
                else:
                    def getScanCallbackFunction(error, result):
                        # if cannot get scan, display error message
                        if error:
                            self.header_title.set_text('Scan failed!')
                            self.error_message.set_text(error['message'])
                            self.header_context.add_class('header_invalid_card')
                            return
                        else:
                            # if card no scan in, add new scan
                            if result == None:
                                # scan in
                                action = 'Security Scan'
                                value = 0.00
                                products = []
                                user = METEOR_USERNAME
                                self.client.call('scanIn',[pid,action,value,products,user],scanInCallbackFunction)
                            # if card already scan in, update scan
                            else:
                                # scan out
                                scan_id = result['_id']
                                self.client.call('scanOut',[scan_id],scanOutCallbackFunction)

                    def scanInCallbackFunction(error,result):
                        # to check if card scan-in success or error
                        if error:
                            self.header_title.set_text('Scan failed!')
                            self.error_message.set_text(error['message'])
                            self.header_context.add_class('header_invalid_card')
                        else:
                            self.header_title.set_text("Scan-in")
                            self.header_context.add_class('header_scan_in')
                    def scanOutCallbackFunction(error,result):
                        # to check if card scan-out success or error
                        if error:
                            self.header_title.set_text('Scan failed!')
                            self.error_message.set_text(error['message'])
                            self.header_context.add_class('header_invalid_card')
                        else:
                            self.header_title.set_text("Scan-out")
                            self.header_context.add_class('header_scan_out')

                    # get scan to check if scan in or scan out
                    self.client.call('get_scan',[pid],getScanCallbackFunction)

                self.pname.set_text(pname)
                self.pbarcode.set_text(barcode)
                self.pexpires.set_text(expires)
                # load picture
                try:
                    slackLog('loading parent picture: '+str(pid),delay=True)
                    fetchPhotosByID(parent_picture)
                    pixbuf = Pixbuf.new_from_file("resource/"+parent_picture)
                    scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
                    self.parent_image.set_from_pixbuf(scaled_buf)
                except Exception as inst:
                    slackLog("No parent picture for: "+pid,delay=True)
                    pixbuf = Pixbuf.new_from_file("static/unknown.jpg")
                    scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
                    self.parent_image.set_from_pixbuf(scaled_buf)

        except KeyError:
            slackLog('Scanned card: '+pid+' could not be found',delay=True)
            #display an error
            self.header_title.set_text("Invalid Card!")
            self.header_context.add_class('header_invalid_card')
            self.pname.set_text("Card Not Found!")
            self.pbarcode.set_text("XXXX")
            self.pexpires.set_text("xxxx-xx-xx")

            pixbuf = Pixbuf.new_from_file("static/NA.JPG")
            scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
            self.parent_image.set_from_pixbuf(scaled_buf)

            #reset everything
            self.entry.set_text('')
            self.app_window.set_focus(self.entry)
            self.app_window.show()


        #try and load the studnts starting after the parents name
        i = 0
        if(len(associations)):

            pool = ThreadPool(len(associations))
            results = pool.map(fetchPhotosByID,associations)
        for sid in associations:
            #if the student picture exists locally, load it
            try:
                pixbuf = Pixbuf.new_from_file("resource/"+sid+".JPG")
                scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,InterpType.BILINEAR)
                self.pickup_students[i].set_from_pixbuf(scaled_buf)
            #if not, load the NA picture to indicate a student w/o a picture
            except:
                print("Unexpected error:```")
                print sys.exc_info()[0]
                pixbuf = Pixbuf.new_from_file("static/NA.JPG")
                scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,InterpType.BILINEAR)
                self.pickup_students[i].set_from_pixbuf(scaled_buf)
            i+=1



        #clear entry box and reset focus
        self.entry.set_text('')
        self.app_window.set_focus(self.entry)
        self.app_window.show()
def main():
    Gtk.main()
    return 0

def fetchPhotosByID(sid):
    #if it's coming in with a file extension, don't add one
    if (sid[-4:] == '.jpg') or (sid[-4:] == '.JPG'):
        url = 'http://chloe.asianhope.org/static/'+sid
    else:
        url = 'http://chloe.asianhope.org/static/'+sid+'.JPG'

    #check to see if the file exists
    fname =url.split("/")[-1]
    filename = "resource/"+fname
    try:
        mtime = os.path.getmtime(filename)
    except OSError:
        mtime = 0
        pass

    #see if we can pull the file
    try:
        response = urllib2.urlopen(url)
    except urllib2.URLError:
        #if we can't that's okay - we'll pretend local is up to date
        mtime = sys.maxint
        response = None
        pass



    #simple cache: less than a week old? replace
    if mtime < (calendar.timegm(time.gmtime())-(7*24*60*60)):
        slackLog("writing to cache: "+filename,delay=True)
        f = open(filename, "wb")
        f.write(response.read())
        f.close()

    if response:
        response.close()

def slackLog(message,icon_emoji=':guardsman:',delay=False):
    global messagequeue
    holdqueue = False
    if not delay:
        r = requests.post(WEBHOOKURL,data={'payload':'{"text":"'+message+'","username":"'+USERNAME+'","icon_emoji":"'+icon_emoji+'"}'})
    else:
        if len(messagequeue)<10:
            messagequeue.append(message)
        else:
            message_with_breaks =''
            for mess in messagequeue:
                message_with_breaks = message_with_breaks+'\n'+str(mess)
            message_with_breaks = message_with_breaks+'\n'+message
            try:
                r = requests.post(WEBHOOKURL,data={'payload':'{"text":"'+message_with_breaks+'","username":"'+USERNAME+'","icon_emoji":"'+icon_emoji+'"}'})
            except requests.exceptions.ConnectionError:
                holdqueue = True

            if not holdqueue:
                messagequeue = []

if __name__=="__main__":
    MyProgram()
    main()
