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


class MyProgram:
    def __init__(self):

        self.parents= {}
        #load parents
        self.client = MeteorClient('ws://chloe.asianhope.org:8080/websocket',debug=False)
        self.client.connect()
        self.client.login('test@test.com','test')
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
                print 'card has missing data, oh well.'
                pass

        # try:
        #     f = open('parents.csv')
        # except:
        #    parent = None
        #    md = gtk.MessageDialog(parent, gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_INFO,
        #             gtk.BUTTONS_CLOSE, "Can't open file!")
        #    md.run()
        #    sys.exit(1)
        # for line in f:
        #     line = line.strip()
        #     info = line.split(',')
        #     pid = info[0]
        #     student_list = []
        #     i = 0
        #
        #     for item in info:
        #         if(i>=1): #parent_id, name, student1, student2, student3... student9
        #             student_list.append(info[i])
        #         i+=1
        #
        #     self.parents.update({pid:student_list})

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
        scaled_buf = pixbuf.scale_simple(177,266,gtk.gdk.INTERP_BILINEAR)

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
        scaled_buf = pixbuf.scale_simple(472,709,gtk.gdk.INTERP_BILINEAR)
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
        for i in range(0,9):
            #make sure all pictures are reset
            pixbuf = gtk.gdk.pixbuf_new_from_file("static/logo.png")
            scaled_buf = pixbuf.scale_simple(177,266,gtk.gdk.INTERP_BILINEAR)
            self.pickup_students[i].set_from_pixbuf(scaled_buf)

        #grab pid
        pid = self.entry.get_text()

        #do a lookup for the name
        try:
            #get parent information
            parent_card = self.client.find_one('cards', selector={'barcode': pid})
            if not parent_card:
                raise(KeyError)

            associations = parent_card.get('associations',[])

            print(parent_card)
            pname = parent_card.get('name', pid)
            parent_picture = parent_card.get('profile',pid+".JPG")
            expires = parent_card.get('expires',"Expiry not set")

            #display parent's name
            pmarkup = '<span size="50000">'+pname+'</span>\n<span size="30000">'+pid+'</span>\n<span size="15000">'+expires+'</span>'

            self.pnamelabel.set_markup(pmarkup)
            self.pnamelabel.show()


        except KeyError:
            #display an error
            pmarkup = '<span color="red" size="64000">Card Not Found</span>'
            self.pnamelabel.set_markup(pmarkup)
            self.pnamelabel.show()
            names = "NA"

    #load pictures
        #if the parent picture exists
        try:
            print 'loading parent picture: '+str(pid)
            fetchPhotosByID(parent_picture)
            pixbuf = gtk.gdk.pixbuf_new_from_file("resource/"+parent_picture)
            scaled_buf = pixbuf.scale_simple(472,709,gtk.gdk.INTERP_BILINEAR)
            self.image.set_from_pixbuf(scaled_buf)

        #if there is no parent picture, indicate it.
        except Exception as inst:
            print inst
            pixbuf = gtk.gdk.pixbuf_new_from_file("static/NA.JPG")
            scaled_buf = pixbuf.scale_simple(472,709,gtk.gdk.INTERP_BILINEAR)
            self.image.set_from_pixbuf(scaled_buf)

        #try and load the studnts starting after the parents name
        i = 0
        pool = ThreadPool(len(associations))
        results = pool.map(fetchPhotosByID,associations)
        for sid in associations:
            #if the student picture exists locally, load it

            try:
                pixbuf = gtk.gdk.pixbuf_new_from_file("resource/"+sid+".JPG")
                scaled_buf = pixbuf.scale_simple(177,266,gtk.gdk.INTERP_BILINEAR)
                self.pickup_students[i].set_from_pixbuf(scaled_buf)
            #if not, load the NA picture to indicate a student w/o a picture
            except:
                print "Unexpected error:", sys.exc_info()[0]
                pixbuf = gtk.gdk.pixbuf_new_from_file("static/NA.JPG")
                scaled_buf = pixbuf.scale_simple(177,266,gtk.gdk.INTERP_BILINEAR)
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
    print sid[-4:]
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
        print("writing to cache")
        f = open(filename, "wb")
        f.write(response.read())
        f.close()

    if response:
        response.close()

if __name__=="__main__":
    MyProgram()
    main()
