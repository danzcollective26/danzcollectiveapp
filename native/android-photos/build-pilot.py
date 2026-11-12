from pathlib import Path
import subprocess,os,zipfile,json
project=Path(__file__).resolve().parent
repo=project.parents[1]
root=project/'.pilot-build'
root.mkdir(exist_ok=True)
sdk=Path(os.environ.get('ANDROID_SDK_ROOT') or os.environ.get('ANDROID_HOME') or '')
if not (sdk/'platforms/android-36/android.jar').exists(): raise SystemExit('Set ANDROID_SDK_ROOT to an SDK with Android 36 and Build Tools 35.0.0')
tools=sdk/'build-tools/35.0.0';android=sdk/'platforms/android-36/android.jar'
app=repo/'native/android-photos/app/src/main'
for p in ['generated','classes','dex','res']: (root/p).mkdir(exist_ok=True)
manifest=(app/'AndroidManifest.xml').read_text().replace('<manifest ', '<manifest package="com.danzcollective.photos" ',1)
(root/'AndroidManifest.xml').write_text(manifest)
(root/'generated/BuildConfig.java').write_text('package com.danzcollective.photos; public final class BuildConfig { public static final String META_APP_ID = ""; }')
def run(args,**kw):
    print('Running '+str(args[0]).split('/')[-1],flush=True)
    subprocess.run([str(a) for a in args],check=True,**kw)
run([tools/'aapt2','compile','--dir',app/'res','-o',root/'res/resources.zip'])
run([tools/'aapt2','link','-o',root/'base.apk','-I',android,'--manifest',root/'AndroidManifest.xml','--min-sdk-version','29','--target-sdk-version','36','--version-code','3','--version-name','0.3.0-pilot','--java',root/'generated',root/'res/resources.zip'])
sources=[*app.glob('java/**/*.java'),* (root/'generated').glob('**/*.java')]
run(['java','com.sun.tools.javac.Main','-source','8','-target','8','-bootclasspath',str(tools/'core-lambda-stubs.jar')+os.pathsep+str(android),'-classpath',android,'-d',root/'classes',*sources])
classes=list((root/'classes').rglob('*.class'))
run([tools/'d8','--min-api','29','--lib',android,'--output',root/'dex',*classes])
with zipfile.ZipFile(root/'base.apk','a') as apk:apk.write(root/'dex/classes.dex','classes.dex',compress_type=zipfile.ZIP_DEFLATED)
run([tools/'zipalign','-p','-f','4',root/'base.apk',root/'aligned.apk'])
key=Path(os.environ.get('DANZ_PILOT_KEYSTORE') or root/'danz-photos-pilot.p12')
if os.environ.get('DANZ_PILOT_KEYSTORE') and not key.is_file(): raise SystemExit('The original pilot signing key was not found')
# A local, non-production pilot certificate. Never commit the private key.
os.umask(0o077)
env=dict(os.environ,DANZ_PILOT_STORE_PASSWORD='android')
if not key.exists():run(['keytool','-genkeypair','-noprompt','-keystore',key,'-storetype','PKCS12','-storepass:env','DANZ_PILOT_STORE_PASSWORD','-alias','danz-photos-pilot','-keyalg','RSA','-keysize','3072','-validity','3650','-dname','CN=DANZ Fotos Pilot, O=DANZ Collective'],env=env)
output=root/'DANZ-Fotos-Android-pilot.apk'
run([tools/'apksigner','sign','--ks',key,'--ks-key-alias','danz-photos-pilot','--ks-pass','env:DANZ_PILOT_STORE_PASSWORD','--out',output,root/'aligned.apk'],env=env)
run([tools/'apksigner','verify','--verbose','--print-certs',output])
run([tools/'aapt2','dump','badging',output])
print(json.dumps({'apk':str(output),'bytes':output.stat().st_size}),flush=True)
