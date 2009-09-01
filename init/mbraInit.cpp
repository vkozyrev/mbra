#include "mbraInit.h"
#include <dmzApplication.h>
#include <dmzAppShellExt.h>
#include <dmzCommandLine.h>
#include <dmzQtConfigRead.h>
#include <dmzQtConfigWrite.h>
#include <dmzRuntimeConfig.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimeSession.h>
#include <dmzRuntimeVersion.h>
#include <dmzSystemFile.h>
#include <dmzTypesHashTableStringTemplate.h>
#include <dmzXMLUtil.h>

#include <QtCore/QUrl>
#include <QtGui/QDesktopServices>
#include <QtGui/QCloseEvent>

using namespace dmz;

namespace {

static const String MBRAName ("mbraInit");
static const String GeometryName ("geometry");

static void
local_restore_session (AppShellInitStruct &init, mbraInit &cInit) {

   Config session = get_session_config (MBRAName, init.app.get_context ());

   Config geometry;

   if (session.lookup_config (GeometryName, geometry)) {

      cInit.restoreGeometry (config_to_qbytearray (geometry));
   }
   else {

      QRect rect = QApplication::desktop ()->availableGeometry (&cInit);
      cInit.move(rect.center () - cInit.rect ().center ());
   }
}

};


dmz::mbraInit::mbraInit (AppShellInitStruct &theInit) :
      init (theInit),
      launchNA (False),
      launchFT (False),
      _start (False) {

   ui.setupUi (this);

   const String DocPath (get_home_directory () + "/Documents/");
   PathContainer c;
   if (get_file_list (DocPath, c)) {

      //ui.fileTable->setRowCount (c.get_count ());
      String file;
      Boolean found = c.get_first (file);   

      int row = 0;

      ui.fileTable->setSortingEnabled (false);

      while (found) {

         file = DocPath + file;
         QFileInfo info (file.get_buffer ());
         if (info.completeSuffix () == "mbra") {

            ui.fileTable->setRowCount (row + 1);
            QTableWidgetItem *name = new QTableWidgetItem (
               info.completeBaseName () + "." + info.completeSuffix ());
            name->setData (Qt::UserRole, info.absoluteFilePath ());
            QTableWidgetItem *date = new QTableWidgetItem;
            date->setData (Qt::DisplayRole, info.lastModified ());
            ui.fileTable->setItem (row, 0, name);
            ui.fileTable->setItem (row, 1, date);
            row++;
         }

         found = c.get_next (file);   
      }

      ui.fileTable->setSortingEnabled (true);
   }
}


dmz::mbraInit::~mbraInit () {

}


void
dmz::mbraInit::on_fileTable_itemDoubleClicked (QTableWidgetItem * item) {

   on_buttonBox_accepted ();
}


void
dmz::mbraInit::on_naButton_clicked () {

   launchNA = True;
   _start = True;
   close ();
}


void
dmz::mbraInit::on_ftButton_clicked () {

   launchFT = True;
   _start = True;
   close ();
}


void
dmz::mbraInit::on_buttonBox_accepted () {

   const int Row = ui.fileTable->currentRow ();

   if (Row >= 0) {

      QTableWidgetItem *item = ui.fileTable->item (Row, 0);

      if (item) {

         selectedFile = item->data (Qt::UserRole).toString ();
      }
   }

   _start = True;
   close ();
}     

   
void  
dmz::mbraInit::on_buttonBox_rejected () {
      
   close ();
}  
      

void
dmz::mbraInit::on_buttonBox_helpRequested () {

   const String UrlValue =
      config_to_string ("help.url", init.manifest, "http://dmzdev.org/wiki/mbra");

   if (UrlValue) {

      QUrl Url (UrlValue.get_buffer ());

      QDesktopServices::openUrl (Url);
   }
}


void
dmz::mbraInit::closeEvent (QCloseEvent * event) {

   if (!_start) {

      init.app.quit ("Cancel Button Pressed");
   }
   else {

      Config session (MBRAName);

      session.add_config (qbytearray_to_config ("geometry", saveGeometry ()));

      set_session_config (init.app.get_context (), session);
   }

   event->accept ();
}

extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL void
dmz_init_mbra (AppShellInitStruct &init) {

   init.fileListPopulated = False;

   if (!init.launchFile) {

      mbraInit minit (init);

      local_restore_session (init, minit);

      if (init.VersionFile) {

         Version version;

         if (xml_to_version (init.VersionFile, version, &init.app.log)) {

            QString vs = minit.windowTitle ();
            vs += " (v";
            const String Tmp = version.get_version ().get_buffer ();
            if (Tmp) { vs += Tmp.get_buffer (); }
            else { vs += "Unknown"; }
            vs += ")";

            minit.setWindowTitle (vs);
         }
      }

      minit.show ();
      minit.raise ();

      while (minit.isVisible ()) {

         QApplication::sendPostedEvents (0, -1);
         QApplication::processEvents (QEventLoop::WaitForMoreEvents);
      }

      if (init.app.is_running ()) {

         if (minit.launchNA || minit.launchFT) {

            CommandLineArgs args ("f");

            if (minit.launchNA) { args.append_arg ("config/start_network.xml"); }
            else if (minit.launchFT) { args.append_arg ("config/start_fault_tree.xml"); }

            CommandLine cl;
            cl.add_args (args);
            init.app.process_command_line (cl);
         }
         else if (!minit.selectedFile.isEmpty ()) {

            init.launchFile = qPrintable (minit.selectedFile);
         }
      }
   }
}

};