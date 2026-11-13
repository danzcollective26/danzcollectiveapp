"""Create the A4 general-access poster. Requires qrcode, Pillow and reportlab.

The QR opens the public PWA. It does not contain an event attendance token.
Keep decorative shapes outside its white quiet zone.
"""
from pathlib import Path
import argparse
import sys

from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import qrcode

APP_URL = 'https://danzcollectiveapp.vercel.app/'
ROOT = Path(__file__).resolve().parents[1]


def matrix():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=0)
    qr.add_data(APP_URL)
    qr.make(fit=True)
    return qr.get_matrix()


def finder(row, col, size):
    return (row < 7 and col < 7) or (row < 7 and col >= size-7) or (row >= size-7 and col < 7)


def qr_png(cells, target):
    n, step = len(cells), 32
    image = Image.new('RGB', ((n+8)*step, (n+8)*step), 'white')
    draw = ImageDraw.Draw(image)
    for row, values in enumerate(cells):
        for col, dark in enumerate(values):
            if dark and not finder(row, col, n):
                x, y = (col+4)*step, (row+4)*step
                draw.rounded_rectangle((x, y, x+step-1, y+step-1), radius=5, fill='#171318')
    for row, col in [(0,0), (0,n-7), (n-7,0)]:
        for inset, length, colour, radius in [(0,7,'#171318',18),(1,5,'white',11),(2,3,'#171318',6)]:
            x,y=(col+4+inset)*step,(row+4+inset)*step
            draw.rounded_rectangle((x,y,x+length*step-1,y+length*step-1),radius=radius,fill=colour)
    target.parent.mkdir(parents=True,exist_ok=True)
    image.save(target,optimize=True)


def flower(pdf,x,y,size,colour):
    pdf.saveState();pdf.translate(x,y);pdf.scale(size/100,size/100)
    pdf.setStrokeColor(colour);pdf.setFillColor(colour);pdf.setLineWidth(4.5)
    for cx,cy in [(50,20),(76,35),(76,65),(50,80),(24,65),(24,35)]:
        pdf.circle(cx,cy,17.8,stroke=1,fill=0)
    pdf.circle(50,50,19.2,stroke=0,fill=1)
    pdf.restoreState()


def heart(pdf,x,y,size,colour,angle=0):
    pdf.saveState();pdf.translate(x,y);pdf.rotate(angle);pdf.scale(size,size)
    pdf.setFillColor(colour)
    path=pdf.beginPath();path.moveTo(0,-.45)
    path.curveTo(-.12,-.30,-.55,0,-.45,.30)
    path.curveTo(-.32,.58,-.05,.52,0,.32)
    path.curveTo(.05,.52,.32,.58,.45,.30)
    path.curveTo(.55,0,.12,-.30,0,-.45);path.close()
    pdf.drawPath(path,stroke=0,fill=1);pdf.restoreState()


def poster(target, cells):
    from reportlab.lib.colors import HexColor
    from reportlab.lib.pagesizes import A4
    ink,rose,cream,violet = map(HexColor,['#171318','#ff789f','#f9e7df','#b8a0ed'])
    fonts=Path('/usr/share/fonts/truetype/dejavu')
    pdfmetrics.registerFont(TTFont('DanzDisplay',str(fonts/'DejaVuSansCondensed-Bold.ttf')))
    pdfmetrics.registerFont(TTFont('DanzText',str(fonts/'DejaVuSans.ttf')))
    target.parent.mkdir(parents=True,exist_ok=True)
    pdf=canvas.Canvas(str(target),pagesize=A4,pageCompression=1)
    pdf.setTitle('DANZ Collective - La noche nos une - QR general A4')
    pdf.setAuthor('DANZ Collective')
    pdf.setSubject('Cartel A4. El QR abre la aplicación pública; no acredita asistencia a una fiesta.')
    pdf.scale(A4[0]/600,A4[1]/850)
    pdf.setFillColor(cream);pdf.rect(0,0,600,850,stroke=0,fill=1)
    # The logo is the actual registered wordmark served by the collective's site.
    pdf.setFillColor(ink);pdf.roundRect(30,754,540,68,8,stroke=0,fill=1)
    pdf.drawImage(ImageReader(str(ROOT/'public/brand/danz-collective-wordmark.png')),55,761,width=490,height=54,preserveAspectRatio=True,anchor='c',mask='auto')
    pdf.setFillColor(ink);pdf.setFont('DanzDisplay',62);pdf.drawString(40,676,'LA NOCHE')
    pdf.setFont('DanzDisplay',78);pdf.drawString(37,607,'NOS UNE.')
    pdf.setFont('DanzDisplay',12);pdf.drawCentredString(300,570,'ESCANEA. ENTRA EN DANZ.')
    heart(pdf,62,409,76,rose,-18);heart(pdf,546,300,76,violet,17)
    heart(pdf,548,608,36,rose,20);heart(pdf,58,128,31,violet,-14)
    flower(pdf,20,224,65,ink);flower(pdf,511,435,66,ink)
    # White card, then four full QR modules of whitespace on every side.
    pdf.setFillColor(ink);pdf.roundRect(100,151,400,400,13,stroke=0,fill=1)
    pdf.setFillColorRGB(1,1,1);pdf.roundRect(103,154,394,394,11,stroke=0,fill=1)
    n=len(cells);box=366;step=box/(n+8);left=117;bottom=168
    pdf.setFillColor(ink)
    for row,values in enumerate(cells):
        for col,dark in enumerate(values):
            if dark and not finder(row,col,n):
                pdf.roundRect(left+(col+4)*step,bottom+(n+3-row)*step,step,step,step*.16,stroke=0,fill=1)
    for row,col in [(0,0),(0,n-7),(n-7,0)]:
        for inset,length,colour,radius in [(0,7,ink,.55),(1,5,HexColor('#ffffff'),.35),(2,3,ink,.2)]:
            pdf.setFillColor(colour)
            pdf.roundRect(left+(col+4+inset)*step,bottom+(n+4-row-7+inset)*step,length*step,length*step,radius*step,stroke=0,fill=1)
    pdf.setFillColor(ink);pdf.setFont('DanzDisplay',21);pdf.drawCentredString(300,116,'TU NOCHE SIGUE AQUÍ.')
    pdf.setFont('DanzText',13);pdf.drawCentredString(300,89,'Fotos, música y DANZ Arcade.')
    pdf.setFont('DanzDisplay',9);pdf.drawCentredString(300,63,'ACCESO GENERAL A LA APP · SIN INSTALAR PARA EMPEZAR')
    pdf.setFont('DanzText',8);pdf.drawCentredString(300,35,APP_URL.removeprefix('https://'))
    pdf.linkURL(APP_URL,(100,151,500,551),relative=1,thickness=0)
    pdf.showPage();pdf.save()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--qr-png',type=Path)
    args=parser.parse_args();cells=matrix()
    poster(args.output,cells)
    if args.qr_png: qr_png(cells,args.qr_png)
    print(f'A4 poster ready; {len(cells)} modules; URL: {APP_URL}')
