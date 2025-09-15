// src/utils/fileIcons.js

import exe from "../assets/icons/exe.png";
import msi from "../assets/icons/msi.png";
import dmg from "../assets/icons/dmg.png";
import pkg from "../assets/icons/pkg.png";
import txt from "../assets/icons/txt.png";
import zip from "../assets/icons/zip.png";
import tar from "../assets/icons/tar.png";
import dpkg from "../assets/icons/dpkg.png";
import doc from "../assets/icons/doc.png";
import xls from "../assets/icons/xls.png";
import ppt from "../assets/icons/ppt.png";
import pdf from "../assets/icons/pdf.png";
import blank from "../assets/icons/blank.png"; // fallback

const fileIcons = {
  exe,
  msi,
  dmg,
  pkg,
  txt,
  zip,
  tar,
  dpkg,
  doc,
  docx: doc,
  xls,
  xlsx: xls,
  ppt,
  pptx: ppt,
  pdf,
  default: blank,
};

export default fileIcons;
