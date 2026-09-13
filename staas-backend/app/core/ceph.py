import boto3
import subprocess
import os

# Config S3/RGW
RGW_ENDPOINT = os.getenv("RGW_ENDPOINT", "http://192.168.1.168:7480")
RGW_ACCESS_KEY = os.getenv("RGW_ACCESS_KEY")
RGW_SECRET_KEY = os.getenv("RGW_SECRET_KEY")

def creer_bucket_s3(nom_bucket: str, quota_gb: int):
    s3 = boto3.client(
        "s3",
        endpoint_url=RGW_ENDPOINT,
        aws_access_key_id=RGW_ACCESS_KEY,
        aws_secret_access_key=RGW_SECRET_KEY,
    )
    s3.create_bucket(Bucket=nom_bucket)
    # Appliquer le quota via radosgw-admin
    subprocess.run(
    f"ssh rim@192.168.1.168 "
    f"'sudo radosgw-admin quota set "
    f"--uid=testuser "
    f"--bucket={nom_bucket} "
    f"--quota-scope=bucket "
    f"--max-size={quota_gb}G'",
    shell=True,
    check=True
              )

    subprocess.run(
    f"ssh rim@192.168.1.168 "
    f"'sudo radosgw-admin quota enable "
    f"--uid=testuser "
    f"--bucket={nom_bucket} "
    f"--quota-scope=bucket'",
    shell=True,
    check=True
)
    return nom_bucket

def creer_export_nfs(nom: str, quota_gb: int):
    result = subprocess.run([
        "ssh", "rim@192.168.1.168",
        f"sudo ceph nfs export create cephfs --cluster-id mynfs "
        f"--pseudo-path /{nom} --fsname cephfs"
    ], capture_output=True, text=True, check=True)
    return f"/{nom}"

def creer_volume_rbd(nom: str, quota_gb: int):
    subprocess.run([
        "ssh", "rim@192.168.1.168",
        f"sudo rbd create rbdpool/{nom} --size {quota_gb}G"
    ], check=True)
    return f"rbdpool/{nom}"

def modifier_quota_s3(nom_bucket: str, nouveau_quota_gb: int):
    subprocess.run(
        f"ssh rim@192.168.1.168 \"sudo radosgw-admin quota set --uid=testuser "
        f"--bucket={nom_bucket} --quota-scope=bucket --max-size={nouveau_quota_gb}GiB && "
        f"sudo radosgw-admin quota enable --uid=testuser --bucket={nom_bucket}\"",
        shell=True,
        check=True
    )
def creer_partage_smb(nom: str, quota_gb: int):
    # Créer le dossier dans CephFS
    subprocess.run(
        f"ssh rim@192.168.1.168 \"sudo mkdir -p /mnt/cephshare/{nom} && sudo chmod 777 /mnt/cephshare/{nom}\"",
        shell=True, check=True
    )
    
    # Écrire la config dans un fichier temporaire puis l'ajouter à smb.conf
    smb_block = (
        f"[{nom}]\\n"
        f"   path = /mnt/cephshare/{nom}\\n"
        f"   browsable = yes\\n"
        f"   writable = yes\\n"
        f"   guest ok = no\\n"
        f"   valid users = rim\\n"
    )
    subprocess.run(
        f"ssh rim@192.168.1.168 \"printf '{smb_block}' | sudo tee -a /etc/samba/smb.conf > /dev/null && sudo systemctl reload smbd\"",
        shell=True, check=True
    )
    return f"\\\\192.168.1.168\\{nom}"
def creer_utilisateur_rgw(client_id: int, nom: str) -> dict:
    """Crée un utilisateur RGW Ceph dédié pour un client et retourne ses clés."""
    uid = f"client{client_id}"
    result = subprocess.run(
        f"ssh rim@192.168.1.168 \"sudo radosgw-admin user create --uid={uid} --display-name='{nom}'\"",
        shell=True, capture_output=True, text=True
    )
    if result.returncode != 0:
        # L'utilisateur existe peut-être déjà — récupère ses infos
        result = subprocess.run(
            f"ssh rim@192.168.1.168 \"sudo radosgw-admin user info --uid={uid}\"",
            shell=True, capture_output=True, text=True, check=True
        )
    import json
    data = json.loads(result.stdout)
    keys = data["keys"][0]
    return {
        "uid": uid,
        "access_key": keys["access_key"],
        "secret_key": keys["secret_key"]
    }

def creer_bucket_s3_client(nom_bucket: str, quota_gb: int, access_key: str, secret_key: str):
    """Crée un bucket S3 sous les clés personnelles du client."""
    import boto3
    import os
    s3 = boto3.client(
        "s3",
        endpoint_url=os.getenv("RGW_ENDPOINT", "http://192.168.1.168:7480"),
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )
    s3.create_bucket(Bucket=nom_bucket)
    # Appliquer le quota
    uid = None
    # Récupérer l'uid depuis les clés
    result = subprocess.run(
        f"ssh rim@192.168.1.168 \"sudo radosgw-admin bucket stats --bucket={nom_bucket}\"",
        shell=True, capture_output=True, text=True
    )
    subprocess.run(
        f"ssh rim@192.168.1.168 \"sudo radosgw-admin quota set --bucket={nom_bucket} "
        f"--quota-scope=bucket --max-size={quota_gb}GiB && "
        f"sudo radosgw-admin quota enable --bucket={nom_bucket}\"",
        shell=True, check=True
    )
    return nom_bucket