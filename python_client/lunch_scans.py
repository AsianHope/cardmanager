from MeteorClient import MeteorClient,MeteorClientException
# import pygtk
# import gtk
import gi
import socket
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
import threading

from credentials import METEOR_USERNAME
from credentials import METEOR_PASSWORD
from credentials import WEBHOOKURL

from datetime import date
from datetime import datetime

from tinydb import TinyDB, where,Query
from uuid import uuid1

from tinydb.storages import MemoryStorage


from pytz import timezone
from gi.repository import GObject

USERNAME = socket.gethostname()
messagequeue = []

REMOTE_SERVER = "chloe.asianhope.org"
PORT = 8080
# REMOTE_SERVER = "127.0.0.1"
# PORT = 3000

# PARENT_DIMENSIONS_X = 450
# PARENT_DIMENSIONS_Y = 680
PARENT_DIMENSIONS_X = 320
PARENT_DIMENSIONS_Y = 442
CHILD_DIMENSIONS_X = 150
CHILD_DIMENSIONS_Y = 200
thread_no = 0
THREADLOCK = threading.Lock()

GObject.threads_init()
class MyProgram:

    def __init__(self):
        slackLog("Lunch card scanner started.")
        self.parents= {}
        self.isServerChange = True
        self.client = MeteorClient('ws://'+REMOTE_SERVER+':'+str(PORT)+'/websocket',debug=False)
        self.client.connect()
        self.client.login(METEOR_USERNAME,METEOR_PASSWORD)
        self.client.subscribe('cards')
        self.client.subscribe('scans')
        time.sleep(3) #give it some time to finish loading everything
        self.all_cards = self.client.find('cards',selector={'type':'Student'})

        self.all_current_scans = [
            x for x in self.client.find('scans',selector={'action': 'Lunch Scans'})
            if x['scantimes'][0].date().isoformat() == date.today().isoformat()
            ]
        print len(self.all_current_scans)
        # get and add to local db
        self.tinydb = TinyDB(storage=MemoryStorage)
        # delete table
        self.tinydb.purge_table("Scans")
        # get table
        tinydb_scans = self.tinydb.table('Scans')
        # insert all scans to tiny db
        tinydb_scans.insert_multiple(self.all_current_scans)

        slackLog("Pulled records for: "+str(len(self.all_cards))+" cards")
        for card in self.all_cards:
            try:
                barcode = card['barcode']
                name = card['name']
                cardtype = card['type']
                expires = card['expires']
                profile = card.get('profile',barcode+".JPG") #default picture
                associations = card.get('associations',[])
                self.parents.update({barcode:card})
            except KeyError:
                print barcode
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
        self.header_title.set_text("Logos Lunch Scans System")

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

        # display student picture
        pixbuf = Pixbuf.new_from_file("static/logo.png")
        scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
        self.parent_image.set_from_pixbuf(scaled_buf)

        self.entry.set_activates_default(True)
        self.app_window.set_focus(self.entry)

        self.error_message.set_text("")
        self.app_window.show_all()

        self.connection_status = True
        self.go_offline = True
        def printit():
                global thread_no
                global THREADLOCK
                THREADLOCK.acquire()
                t = threading.Timer(5.0, printit)
                t.start()

                thread_no = thread_no+1
                self.is_connected()
                if self.connection_status == False:
                    if self.go_offline == True:
                        GObject.idle_add(self.change_header,"You are now Offline!","header_invalid_card")
                        print "offline"
                        self.go_offline = False

                else:
                    # reconnected
                    if self.go_offline == False:
                        print('* RECONNECTED and sync to live db')
                         # bulk_insert_update_scans
                        scans = self.tinydb.table('Scans').all()
                        print len(scans)
                        if (scans != None) & (len(scans)>0):
                            def call_back_bulk_insert_update(error,result):
                                 # to check if bulk insert/update success or error
                                 if error:
                                     print "sync error"
                                 else:
                                     print 'sync success'
                                 GObject.idle_add(self.change_header,"You are now Online!","header_scan_in")
                            try:
                                self.client.call('bulk_insert_update_lunch_scans',[scans],call_back_bulk_insert_update)
                            except Exception as e:
                                 GObject.idle_add(self.change_header,"Error! "+str(e),"header_invalid_card")
                                 pass
                            finally:
                                 self.go_offline = True
                        else:
                            self.go_offline = True
                            GObject.idle_add(self.change_header,"You are now Online!","header_scan_in")

                THREADLOCK.release()

        printit()
        return
    def change_header(self,title,class_names):
        print title
        print class_names
        header_class_list = self.header_context.list_classes()
        for class_name in header_class_list:
            self.header_context.remove_class(class_name)
        self.header_title.set_text(title)
        self.header_context.add_class(class_names)
    def is_connected(self):
      try:
        # see if we can resolve the host name -- tells us if there is
        # a DNS listening

        host = socket.gethostbyname(REMOTE_SERVER)
        # connect to the host -- tells us if the host is actually
        # reachable
        s = socket.create_connection((host, PORT), 2)
        self.connection_status = True
      except:
        self.connection_status = False

    # filter scantime length equal 1 or scantime[1] is null
    def search_lunch_scans(self,val):
        match = False
        scantime = val[0].date().isoformat()
        if scantime == date.today().isoformat():
            match = True
        return match
    def append(self,field, value):
        """
        Append a given value to a given array field.
        """
        def transform(element):
            element[field].append(value)
        return transform
    def search_button_clicked(self, widget, data=None):
        associations = []
        ate_lunch = False
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
                self.header_title.set_text("Invalid Card")
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
                    if 'LUNCH' in associations:
                        if self.connection_status == True:
                            print "scan online"
                            query = Query()
                            tinydb_scans = self.tinydb.table('Scans')
                            def scanInCallbackFunction(error,result):
                                # to check if card scan-in success or error
                                if error:
                                    self.header_title.set_text('Scan failed!')
                                    self.error_message.set_text(error['message'])
                                    self.header_context.add_class('header_invalid_card')
                                else:
                                    if ate_lunch == True:
                                        self.header_title.set_text("Lunch Scans (Already Scan)")
                                        self.header_context.add_class('header_scan_out')
                                        self.isServerChange = False
                                    else:
                                        self.header_title.set_text("Lunch Scans")
                                        self.header_context.add_class('header_scan_in')
                                        self.isServerChange = False

                            try:
                                result = tinydb_scans.search((query.cardnumber == pid) & (query.action == 'Lunch Scans') & (query.scantimes.test(self.search_lunch_scans)))[0]
                                ate_lunch = True
                            except IndexError:
                                    pass
                            try:
                                #  insert to local db
                                tiny_db_scan_id = str(uuid1()).replace("-","")
                                tinydb_scans.insert({'_id':tiny_db_scan_id,'cardnumber': pid, 'scantimes': [datetime.now(timezone('UTC'))],'action':'Lunch Scans','value':0.00,'products':[],'user':METEOR_USERNAME})

                                # scan in  (live db)
                                action = 'Lunch Scans'
                                value = 0.00
                                products = []
                                user = METEOR_USERNAME
                                self.client.insert('scans', {
                                        'cardnumber': pid,
                                        'scantimes':[datetime.now(timezone('UTC'))],
                                        'action': action,
                                        'value':value,
                                        'products':products,
                                        'user':user,
                                        '_id':tiny_db_scan_id
                                        },scanInCallbackFunction)
                            except Exception as e:
                                print e
                        # offline
                        else:
                            print "scan offline"
                            query = Query()
                            tinydb_scans = self.tinydb.table('Scans')

                            # check if going to scan-in or scan-out
                            try:
                                try:
                                     result = tinydb_scans.search((query.cardnumber == pid) & (query.action == 'Lunch Scans') & (query.scantimes.test(self.search_lunch_scans)))[0]
                                     ate_lunch = True
                                except IndexError:
                                    pass
                                #  scan in
                                tiny_db_scan_id = str(uuid1()).replace("-","")
                                tinydb_scans.insert({'_id':tiny_db_scan_id,'cardnumber': pid, 'scantimes': [datetime.now(timezone('UTC'))],'action':'Lunch Scans','value':0.00,'products':[],'user':METEOR_USERNAME})
                                if ate_lunch == True:
                                    self.header_title.set_text("Lunch Scans (Already Scan)")
                                    self.header_context.add_class('header_scan_out')
                                else:
                                    self.header_title.set_text('Offline Lunch Scans')
                                    self.header_context.add_class('header_scan_in')
                            except Exception as e:
                                 print e

                    # no lunch
                    else:
                        associations = ['NOLUNCH']
                        self.header_title.set_text('No Lunch!')
                        self.header_context.add_class('header_expired')

                self.pname.set_text(pname)
                self.pbarcode.set_text(barcode)
                self.pexpires.set_text(expires)


                # load picture
                try:
                    slackLog('loading student picture: '+str(pid),delay=True)
                    fetchPhotosByID(parent_picture)
                    pixbuf = Pixbuf.new_from_file("resource/"+parent_picture)
                    scaled_buf = pixbuf.scale_simple(PARENT_DIMENSIONS_X,PARENT_DIMENSIONS_Y,InterpType.BILINEAR)
                    self.parent_image.set_from_pixbuf(scaled_buf)
                except Exception as inst:
                    slackLog("No student picture for: "+pid,delay=True)
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
        for sid in associations:
            try:
                pixbuf = Pixbuf.new_from_file("resource/"+sid+".JPG")
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
