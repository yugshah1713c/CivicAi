from ultralytics import YOLO

model = YOLO("yolo26n.pt")

results = model("https://ultralytics.com/images/bus.jpg")

for result in results:
    class_id = result.boxes.cls
    class_conf = result.boxes.conf
    class_bound_box = result.boxes.xyxy
    i = 0
    while True:
        if i >= len(class_id):
            break
        else:
            id = int(class_id[i])
            conf = class_conf[i]
            coord = class_bound_box[i]
            print(f"{model.names[id]} => {conf} =>box {coord}")
            i += 1