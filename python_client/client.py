from MeteorClient import MeteorClient
import pygtk
import gtk
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

USERNAME = socket.gethostname()
WEBHOOKURL = 'https://hooks.slack.com/services/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'
messagequeue = []

PARENT_DIMENSIONS_X = 450
PARENT_DIMENSIONS_Y = 680
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
        time.sleep(1) #give it some time to finish loading everything

        self.all_cards = self.client.find('cards')


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


        #create a new window
        self.app_window = gtk.Window(gtk.WINDOW_TOPLEVEL)
        self.app_window.fullscreen()
        self.app_window.set_title("POCAR")

        #change color of window??
        #self.green = gtk.gdk.color_parse('green')
        #self.black = gtk.gdk.color_parse('black')
        #self.app_window.modify_bg(gtk.STATE_NORMAL,self.black)

        #add entry and search fields
        self.entry = gtk.Entry()
        self.button_search = gtk.Button("Search")
        self.button_search.connect("clicked", self.search_button_clicked, "3")
        self.button_search.set_size_request(50,50)

        #add image display area
        self.student_pic = gtk.EventBox()
        self.student_id= gtk.EventBox()

        spacer1 = gtk.EventBox()
        spacer2 = gtk.EventBox()

        self.pnamelabel=gtk.Label("Parentsen, Parentina")
        init = '<span size="64000">Logos Pickup Card System</span>'
        self.pnamelabel.set_markup(init)
        spacer1.add(self.pnamelabel)

        pixbuf = gtk.gdk.pixbuf_new_from_file("static/logo.png")
        scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)

        self.pickup_students = ['0']*9 #seed the list with the size we want
        for i in range(0,9):
            self.pickup_students[i] = gtk.Image()
            self.pickup_students[i].set_from_pixbuf(scaled_buf)
            self.pickup_students[i].show()

        self.label=gtk.Table(3,3,True)
        self.label.attach(self.pickup_students[0],0,1,0,1)
        self.label.attach(self.pickup_students[1],1,2,0,1)
        self.label.attach(self.pickup_students[2],2,3,0,1)

        self.label.attach(self.pickup_students[3],0,1,1,2)
        self.label.attach(self.pickup_students[4],1,2,1,2)
        self.label.attach(self.pickup_students[5],2,3,1,2)

        self.label.attach(self.pickup_students[6],0,1,2,3)
        self.label.attach(self.pickup_students[7],1,2,2,3)
        self.label.attach(self.pickup_students[8],2,3,2,3)

        vbox = gtk.VBox()
        student_info = gtk.HBox()
        controls = gtk.VBox()
        bottom_area = gtk.HBox()

        controls.pack_start(self.entry,fill=False)
        controls.pack_start(self.button_search,fill=False)

        student_info.pack_start(self.student_pic,fill=False)
        #student_info.pack_start(self.student_id,fill=False)
        student_info.pack_start(self.label, True, True, 0)

        bottom_area.pack_start(spacer1, fill=False)
        bottom_area.pack_start(controls)
       # bottom_area.pack_start(spacer2)

        vbox.pack_start(student_info)
        vbox.pack_start(bottom_area)
        self.app_window.add(vbox)

        self.image = gtk.Image()
        pixbuf = gtk.gdk.pixbuf_new_from_file("static/logo.png")
        scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)
        self.image.set_from_pixbuf(scaled_buf)
        self.image.show()

        self.student_pic.add(self.image)

        self.button_search.set_flags(gtk.CAN_DEFAULT)
        self.button_search.grab_default()
        self.entry.set_activates_default(True)
        self.app_window.set_focus(self.entry)

        self.app_window.show_all()

        return

    def search_button_clicked(self, widget, data=None):
        associations = []
        for i in range(0,9):
            #make sure all pictures are reset
            pixbuf = gtk.gdk.pixbuf_new_from_file("static/logo.png")
            scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)
            self.pickup_students[i].set_from_pixbuf(scaled_buf)

        #grab pid
        pid = self.entry.get_text()
        slackLog('Scanned card: '+pid,delay=True)

        #do a lookup for the name
        try:
            #get parent information
            parent_card = self.client.find_one('cards', selector={'barcode': pid})
            if not parent_card:
                raise(KeyError)

            associations = parent_card.get('associations',[])

            slackLog('```'+str(parent_card)+'```',delay=True)
            pname = parent_card.get('name', pid)
            parent_picture = parent_card.get('profile',pid+".JPG")
            expires = parent_card.get('expires',"Expiry not set")

            #display parent's name
            pmarkup = '<span size="50000">'+pname+'</span>\n<span size="30000">'+pid+'</span>\n<span size="15000">'+expires+'</span>'

            self.pnamelabel.set_markup(pmarkup)
            self.pnamelabel.show()


        except KeyError:
            slackLog('Scanned card: '+pid+' could not be found',delay=True)
            #display an error
            pmarkup = '<span color="red" size="64000">Card Not Found</span>'
            self.pnamelabel.set_markup(pmarkup)
            self.pnamelabel.show()
            names = "NA"
            #reset everything
            self.entry.set_text('')
            self.app_window.set_focus(self.entry)
            self.app_window.show()

    #load pictures
        #if the parent picture exists
        try:
            slackLog('loading parent picture: '+str(pid),delay=True)
            fetchPhotosByID(parent_picture)
            pixbuf = gtk.gdk.pixbuf_new_from_file("resource/"+parent_picture)
            scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)
            self.image.set_from_pixbuf(scaled_buf)

        #if there is no parent picture, indicate it.
        except Exception as inst:
            slackLog("No parent picture for: "+pid,delay=True)
            pixbuf = gtk.gdk.pixbuf_new_from_file("static/NA.JPG")
            scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)
            self.image.set_from_pixbuf(scaled_buf)

        #try and load the studnts starting after the parents name
        i = 0
        if(len(associations)):
            pool = ThreadPool(len(associations))
            results = pool.map(fetchPhotosByID,associations)
        for sid in associations:
            #if the student picture exists locally, load it

            try:
                pixbuf = gtk.gdk.pixbuf_new_from_file("resource/"+sid+".JPG")
                scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)
                self.pickup_students[i].set_from_pixbuf(scaled_buf)
            #if not, load the NA picture to indicate a student w/o a picture
            except:
                print("Unexpected error:```")
                print sys.exc_info()[0]
                pixbuf = gtk.gdk.pixbuf_new_from_file("static/NA.JPG")
                scaled_buf = pixbuf.scale_simple(CHILD_DIMENSIONS_X,CHILD_DIMENSIONS_Y,gtk.gdk.INTERP_BILINEAR)
                self.pickup_students[i].set_from_pixbuf(scaled_buf)
            i+=1



        #clear entry box and reset focus
        self.entry.set_text('')
        self.app_window.set_focus(self.entry)
        self.app_window.show()
def main():
    gtk.main()
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
            r = requests.post(WEBHOOKURL,data={'payload':'{"text":"'+message_with_breaks+'","username":"'+USERNAME+'","icon_emoji":"'+icon_emoji+'"}'})
            messagequeue = []

if __name__=="__main__":
    MyProgram()
    main()
